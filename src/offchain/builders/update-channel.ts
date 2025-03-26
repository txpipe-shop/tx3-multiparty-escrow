import { Addresses, Data, fromUnit, Lucid } from "@spacebudz/lucid";
import { config } from "../../config.ts";
import {
  SingularityChannelMint,
  SingularityChannelSpend,
  TypesDatum,
} from "../types/plutus.ts";
import { UpdateChannelParams } from "./../../shared/api-types.ts";

export const updateChannel = async (
  lucid: Lucid,
  { channelId, addDeposit, expirationDate }: UpdateChannelParams
) => {
  const validator = new SingularityChannelMint();
  const scriptAddress = Addresses.scriptToAddress(lucid.network, validator);
  const scriptHash = Addresses.inspect(scriptAddress).payment?.hash;

  const utxoAtScript = (await lucid.utxosAt(scriptAddress)).find(
    (utxo) =>
      Data.from(utxo.datum ?? "", SingularityChannelSpend.datum).channelId ==
      channelId
  );
  if (!utxoAtScript) throw new Error("Channel not found");

  const channelToken = Object.keys(utxoAtScript.assets).find(
    (asset) => fromUnit(asset).policyId === scriptHash
  );
  if (!channelToken) throw new Error("channelToken not found");

  const senderPubKeyHash = fromUnit(channelToken).assetName;
  if (!senderPubKeyHash) throw new Error("senderPubKeyHash not found");

  const datumStr = utxoAtScript.datum!;
  const datum: TypesDatum = Data.from(datumStr, SingularityChannelSpend.datum);

  const newDeposit = utxoAtScript.assets[config.token] + (addDeposit ?? 0n);
  const newExpirationDate = expirationDate || datum.expirationDate;

  const newDatum: TypesDatum = { ...datum, expirationDate: newExpirationDate };

  const tx = lucid
    .newTx()
    .collectFrom(
      [utxoAtScript],
      Data.to("Update", SingularityChannelSpend.redeemer)
    )
    .attachScript(validator)
    .payToContract(
      scriptAddress,
      { Inline: Data.to(newDatum, SingularityChannelSpend.datum) },
      { [config.token]: newDeposit, [channelToken]: 1n }
    )
    .attachMetadata(674, { msg: ["Update Channel"] });

  if (newExpirationDate != datum.expirationDate) tx.addSigner(senderPubKeyHash);

  const completeTx = await tx.commit();
  return { updatedChannelTx: completeTx.toString() };
};
