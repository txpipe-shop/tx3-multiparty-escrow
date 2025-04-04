import { Addresses, Data, Lucid, toUnit } from "@spacebudz/lucid";
import { fromChannelDatum } from "../lib/utils.ts";
import { SingularityChannelSpend, TypesDatum } from "../types/plutus.ts";
import { ChannelValidator } from "../types/types.ts";
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

  const channelUtxo = (
    await lucid.utxosAtWithUnit(scriptAddress, channelToken)
  ).find(({ txHash, outputIndex, datum }) => {
    if (!datum) {
      console.warn(
        `Channel UTxO without datum found: ${txHash}#${outputIndex}`,
      );
      return false;
    }
    try {
      const { channelId: cId } = fromChannelDatum(datum);
      return cId == channelId;
    } catch (e) {
      console.warn(e);
      return false;
    }
  });
  if (!channelUtxo) throw new Error("Channel not found");

  const datumStr = channelUtxo.datum;
  if (!datumStr) throw new Error("Datum not found at Channel UTxO");
  const datum: TypesDatum = Data.from(datumStr, SingularityChannelSpend.datum);

  const msg: [bigint, string, bigint] = [datum.nonce, datum.channelId, amount];
  const payload = Data.to(msg, SignatureSchema);

  return { payload: payload.toString() };
};
