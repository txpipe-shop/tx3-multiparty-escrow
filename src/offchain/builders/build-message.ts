import { Addresses, Data, Lucid, toUnit } from "@spacebudz/lucid";
import { fromChannelDatum, getChannelUtxo } from "../lib/utils.ts";
import { TypesDatum } from "../types/plutus.ts";
import { ChannelDatum, ChannelValidator } from "../types/types.ts";
import { BuildMessageParams } from "./../../shared/api-types.ts";

export const SignatureSchema = Data.Tuple([
  Data.Integer(),
  Data.Bytes(),
  Data.Integer(),
]);

export const buildMessage = async (
  lucid: Lucid,
  { channelId, amount, senderAddress }: BuildMessageParams,
) => {
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
  const datum: ChannelDatum = fromChannelDatum(channelUtxo.datum!);

  const msg: [bigint, string, bigint] = [datum.nonce, datum.channelId, amount];
  const payload = Data.to(msg, SignatureSchema);
  return { payload };
};
