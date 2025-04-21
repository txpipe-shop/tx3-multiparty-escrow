import { fromUnit, Lucid } from "@spacebudz/lucid";
import { fromChannelDatum, validatorDetails } from "../lib/utils.ts";
import { ChannelInfo } from "../types/types.ts";

export const getAllChannels = async (lucid: Lucid): Promise<ChannelInfo[]> => {
  const { scriptAddress, scriptHash: policyId } = validatorDetails(lucid);
  const utxos = await lucid.utxosAt(scriptAddress);

  return utxos
    .map((utxo) => {
      const { assets: balance, txHash, outputIndex, datum } = utxo;
      const [channelToken] = Object.keys(utxo.assets).filter((key) =>
        key.startsWith(policyId)
      );
      const sender = fromUnit(channelToken).assetName;
      if (!sender) {
        console.warn(
          `Invalid sender address: ${sender}. Must have a payment key.
          Utxo: : ${txHash}#${outputIndex}`
        );
        return null;
      }
      if (!datum) {
        console.warn(
          `Channel UTxO without datum found: ${txHash}#${outputIndex}`
        );
        return null;
      }
      try {
        const { channelId, nonce, signer, receiver, groupId, expirationDate } =
          fromChannelDatum(datum);
        return {
          txHash,
          outputIndex,
          balance,
          channelId,
          nonce,
          signer,
          sender,
          receiver,
          groupId,
          expirationDate,
          active: Date.now() < expirationDate,
        };
      } catch (_) {
        console.warn(
          `Invalid datum found in channel UTxO: ${utxo.txHash}#${utxo.outputIndex}`
        );
        return null;
      }
    })
    .filter((channel) => channel !== null);
};
