import { Addresses, Data, Lucid } from "@spacebudz/lucid";
import {
  SingularityChannelMint,
  SingularityChannelSpend,
  TypesDatum,
} from "../types/plutus.ts";
import { BuildMessageParams } from "./../../shared/api-types.ts";

export const SignatureSchema = Data.Tuple([
  Data.Integer(),
  Data.Bytes(),
  Data.Integer(),
]);

export const buildMessage = async (
  lucid: Lucid,
  { channelId, amount }: BuildMessageParams,
) => {
  const validator = new SingularityChannelMint();
  const scriptAddress = Addresses.scriptToAddress(lucid.network, validator);

  const utxoAtScript = (await lucid.utxosAt(scriptAddress)).find(
    ({ txHash, outputIndex, datum }) => {
      if (!datum) {
        console.warn(
          `Channel UTxO without datum found: ${txHash}#${outputIndex}`,
        );
        return false;
      }
      try {
        const { channelId: cId } = Data.from(
          datum,
          SingularityChannelSpend.datum,
        );
        return cId == channelId;
      } catch (e) {
        console.warn(e);
        return false;
      }
    },
  );
  if (!utxoAtScript) throw new Error("Channel not found");

  const datumStr = utxoAtScript.datum;
  if (!datumStr) throw new Error("Datum not found at Channel UTxO");
  const datum: TypesDatum = Data.from(datumStr, SingularityChannelSpend.datum);

  const msg: [bigint, string, bigint] = [datum.nonce, datum.channelId, amount];
  const payload = Data.to(msg, SignatureSchema);

  return { payload: payload.toString() };
};
