import { addAssets, Addresses, Lucid, toUnit, Utxo } from "@spacebudz/lucid";
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
  }: ClaimChannelParams,
  scriptRef: Utxo,
  currentTime: bigint
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

  // Build values
  const receiverPayout = {
    [config.token]: amount,
  };
  const newChannelValue = addAssets(channelUtxo.assets, {
    [config.token]: -amount,
  });
  // Build new datum
  const newDatum = toChannelDatum({ ...datum, nonce: datum.nonce + 1n });

  const tx = await lucid
    .newTx()
    .readFrom([scriptRef])
    .collectFrom(
      [channelUtxo],
      toChannelRedeemer({ Claim: { amount, signature } })
    )
    .payToContract(channelUtxo.address, { Inline: newDatum }, newChannelValue)
    .payTo(receiverAddress, receiverPayout)
    .validTo(Number(datum.expirationDate))
    .attachMetadata(674, { msg: ["Claim Channel"] })
    .commit();

  return { cbor: tx.toString() };
};
