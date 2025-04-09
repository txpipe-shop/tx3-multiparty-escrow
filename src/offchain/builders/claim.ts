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
} from "../lib/utils.ts";
import { ChannelValidator } from "../types/types.ts";

export const claim = async (
  lucid: Lucid,
  {
    senderAddress,
    receiverAddress,
    channelId,
    amount,
    signature,
    finalize,
  }: ClaimChannelParams,
  scriptRef: Utxo,
  currentTime: bigint,
): Promise<{ cbor: string }> => {
  const validator = new ChannelValidator();
  const scriptAddress = Addresses.scriptToAddress(lucid.network, validator);
  const scriptAddressDetails = Addresses.inspect(scriptAddress).payment;
  if (!scriptAddressDetails) throw new Error("Script credentials not found");
  const scriptHash = scriptAddressDetails.hash;

  const senderDetails = Addresses.inspect(senderAddress).payment;
  if (!senderDetails) throw new Error("Sender's credentials not found");
  const senderPubKeyHash = senderDetails.hash;

  const channelToken = toUnit(scriptHash, senderPubKeyHash);
  const channelUtxo = await getChannelUtxo(lucid, channelToken, channelId);
  if (!channelUtxo) throw new Error("Channel not found");
  const datum = fromChannelDatum(channelUtxo.datum!);
  const hasExpired = currentTime > datum.expirationDate;
  if (hasExpired) throw new Error("Channel already expired");

  // Start base tx
  const tx = lucid
    .newTx()
    .readFrom([scriptRef])
    .collectFrom(
      [channelUtxo],
      toChannelRedeemer({ Claim: { amount, signature, finalize } }),
    )
    .validTo(Number(datum.expirationDate));

  // Check whether it's a normal claim or claim & close
  const valueResult = addAssets(channelUtxo.assets, {
    [config.token]: -amount,
  });
  let msg: [string];
  if (finalize) {
    // Return to sender
    const returnAssets = addAssets(valueResult, { [channelToken]: -1n });
    tx.mint({ [channelToken]: -1n }, Data.void()).payTo(
      senderAddress,
      returnAssets,
    );
    msg = ["Claim and close"];
  } else {
    // Build continuing output
    const newDatum = toChannelDatum({ ...datum, nonce: datum.nonce + 1n });
    tx.payToContract(channelUtxo.address, { Inline: newDatum }, valueResult);
    msg = ["Claim"];
  }

  // Build receiver payout and finalize tx
  const receiverPayout = {
    [config.token]: amount,
  };
  const txComplete = await tx.payTo(receiverAddress, receiverPayout)
    .attachMetadata(674, { msg })
    .commit();

  return { cbor: txComplete.toString() };
};
