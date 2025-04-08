import { Addresses, Data, Lucid, toUnit } from "@spacebudz/lucid";
import {
  fromChannelDatum,
  getChannelUtxo,
  validatorDetails,
} from "../lib/utils.ts";
import { ChannelDatum } from "../types/types.ts";
import { BuildMessageParams } from "./../../shared/api-types.ts";

export const SignatureSchema = Data.Tuple([
  Data.Integer(),
  Data.Bytes(),
  Data.Integer(),
]);

export const buildMessage = async (
  lucid: Lucid,
  { channelId, amount, senderAddress }: BuildMessageParams
) => {
  const { scriptHash } = validatorDetails(lucid);
  const senderPubKeyHash = Addresses.addressToCredential(senderAddress).hash;

  const channelToken = toUnit(scriptHash, senderPubKeyHash);
  const channelUtxo = await getChannelUtxo(lucid, channelToken, channelId);
  if (!channelUtxo) throw new Error("Channel not found");
  const datum: ChannelDatum = fromChannelDatum(channelUtxo.datum!);

  const msg: [bigint, string, bigint] = [datum.nonce, datum.channelId, amount];
  const payload = Data.to(msg, SignatureSchema);
  return { payload };
};
