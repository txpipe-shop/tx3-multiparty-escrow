import {
  addAssets,
  Addresses,
  Data,
  Lucid,
  toUnit,
  Utxo,
} from "@spacebudz/lucid";
import { config } from "../../config.ts";
import { ClaimChannelParams } from "../../shared/api-types.ts";
import {
  fromChannelDatum,
  getChannelUtxo,
  toChannelDatum,
  toChannelRedeemer,
  validatorDetails,
} from "../lib/utils.ts";

/**
 * Builds a transaction to claim one or more channels. This function assumes that all channels being claimed
 * have the same receiver.
 */
export const claim = async (
  lucid: Lucid,
  params: ClaimChannelParams,
  scriptRef: Utxo,
  currentTime: bigint,
): Promise<{ claimChannelCbor: string }> => {
  const { scriptHash, scriptRewardAddress } = validatorDetails(lucid);

  // Get all channel utxos
  const channels = [];
  for (const channel of params.channels) {
    try {
      const { senderAddress, channelId } = channel;
      const senderPubKeyHash =
        Addresses.addressToCredential(senderAddress).hash;
      const channelToken = toUnit(scriptHash, senderPubKeyHash);
      const channelUtxo = await getChannelUtxo(lucid, channelToken, channelId);
      if (!channelUtxo) throw new Error("Channel utxo not found");
      channels.push({
        ...channel,
        utxo: channelUtxo,
        channelToken,
      });
    } catch (e) {
      console.error(`Error getting channel UTXO for ${channel.channelId}`);
      console.error(e);
    }
  }

  // Sort utxos lexicographically
  channels.sort((a, b) => {
    const aLex = `${a.utxo.txHash}${a.utxo.outputIndex}`;
    const bLex = `${b.utxo.txHash}${b.utxo.outputIndex}`;
    if (aLex < bLex) return -1;
    return 1;
  });

  // Build tx
  const tx = lucid.newTx().readFrom([scriptRef]);
  let receiverAmount = 0n;
  let lowestExpDate = BigInt(Number.MAX_SAFE_INTEGER);
  for (const channel of channels) {
    const {
      senderAddress,
      channelId,
      amount,
      signature,
      finalize,
      utxo,
      channelToken,
    } = channel;
    try {
      if (!utxo.datum) throw new Error("Channel datum not found");
      const datum = fromChannelDatum(utxo.datum);
      const hasExpired = currentTime > datum.expirationDate;
      if (hasExpired) throw new Error("Channel already expired");
      if (datum.expirationDate < lowestExpDate)
        lowestExpDate = datum.expirationDate;

      const valueResult = addAssets(utxo.assets, { [config.token]: -amount });
      // Check whether it's a normal claim or claim & close
      if (finalize) {
        // Return to sender
        tx.mint({ [channelToken]: -1n }, Data.void());
        tx.payTo(
          senderAddress,
          addAssets(valueResult, { [channelToken]: -1n }),
        );
      } else {
        // Build continuing output
        tx.payToContract(
          utxo.address,
          { Inline: toChannelDatum({ ...datum, nonce: datum.nonce + 1n }) },
          valueResult,
        );
      }
      // Collect channel utxo and accumulate receiver payout
      tx.collectFrom(
        [utxo],
        toChannelRedeemer({ Claim: { amount, signature, finalize } }),
      );
      receiverAmount += amount;
    } catch (e) {
      console.error(
        `Error claiming channel with id: ${channelId}, skipping...`,
      );
      console.error(e);
    }
  }
  if (receiverAmount === 0n) throw new Error("No channels available to claim");

  const expiration =
    Date.now() + 1000 * 60 * 3 <= lowestExpDate
      ? Date.now() + 1000 * 60 * 3
      : lowestExpDate;

  // Build metadata, receiver payout and finalize tx
  const msg =
    channels.length == 1
      ? ["Claim single channel"]
      : ["Claim multiple channels"];
  const receiverPayout = { [config.token]: receiverAmount };
  const receiverAddress = params.receiverAddress;
  lucid.selectReadOnlyWallet({ address: receiverAddress });
  const txComplete = await tx
    .withdraw(scriptRewardAddress, 0n, Data.void())
    .addSigner(Addresses.addressToCredential(receiverAddress).hash)
    .payTo(receiverAddress, receiverPayout)
    .validTo(Number(expiration))
    .attachMetadata(674, { msg })
    .commit();

  return { claimChannelCbor: txComplete.toString() };
};
