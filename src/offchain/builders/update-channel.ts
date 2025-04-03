import { Addresses, fromUnit, Lucid, Utxo } from "@spacebudz/lucid";
import { config } from "../../config.ts";
import { ChannelValidator, ChannelDatum } from "../types/types.ts";
import { UpdateChannelParams } from "./../../shared/api-types.ts";
import { fromChannelDatum, toChannelDatum, toChannelRedeemer } from "../lib/utils.ts";

export const updateChannel = async (
  lucid: Lucid,
  { channelId, addDeposit, expirationDate, userAddress }: UpdateChannelParams,
  scriptRef: Utxo
) => {
  const validator = new ChannelValidator();
  const scriptAddress = Addresses.scriptToAddress(lucid.network, validator);
  const scriptAddressDetails = Addresses.inspect(scriptAddress).payment;
  if (!scriptAddressDetails) throw new Error("Script credentials not found");
  const scriptHash = scriptAddressDetails.hash;

  const utxoAtScript = (await lucid.utxosAt(scriptAddress)).find(
    ({ txHash, outputIndex, datum }) => {
      if (!datum) {
        console.warn(
          `Channel UTxO without datum found: ${txHash}#${outputIndex}`
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
    }
  );

  if (!utxoAtScript) throw new Error("Channel not found");

  const channelToken = Object.keys(utxoAtScript.assets).find(
    (asset) => fromUnit(asset).policyId === scriptHash
  );
  if (!channelToken) throw new Error("channelToken not found");

  const senderPubKeyHash = fromUnit(channelToken).assetName;
  if (!senderPubKeyHash) throw new Error("senderPubKeyHash not found");

  const datumStr = utxoAtScript.datum;
  if (!datumStr) throw new Error("Datum not found at Channel UTxO");
  const datum: ChannelDatum = fromChannelDatum(datumStr);

  const newDeposit = utxoAtScript.assets[config.token] + (addDeposit ?? 0n);
  const newExpirationDate = expirationDate || datum.expirationDate;

  const newDatum: ChannelDatum = { ...datum, expirationDate: newExpirationDate };

  const tx = lucid
    .newTx()
    .readFrom([scriptRef])
    .collectFrom(
      [utxoAtScript],
      toChannelRedeemer("Update")
    )
    .payToContract(
      scriptAddress,
      { Inline: toChannelDatum(newDatum) },
      { [config.token]: newDeposit, [channelToken]: 1n }
    )
    .attachMetadata(674, { msg: ["Update Channel"] });

  if (newExpirationDate != datum.expirationDate) tx.addSigner(senderPubKeyHash);

  lucid.selectReadOnlyWallet({ address: userAddress });
  const completeTx = await tx.commit();
  return { updatedChannelCbor: completeTx.toString() };
};
