import { Data, fromUnit, Hasher, Lucid } from "@spacebudz/lucid";
import { SingularityChannelSpend } from "../types/plutus.ts";
import { ChannelInfo } from "../types/types.ts";

export const getAllChannels = async (lucid: Lucid): Promise<ChannelInfo[]> => {
  const validator = new SingularityChannelSpend();
  const scriptAddress = lucid.utils.scriptToAddress(validator);
  const utxos = await lucid.utxosAt(scriptAddress);
  const policyId = Hasher.hashScript(validator);

  return utxos
    .map((utxo) => {
      const { assets: balance, txHash, outputIndex } = utxo;
      const [channelToken] = Object.keys(utxo.assets).filter((key) =>
        key.startsWith(policyId)
      );
      const sender = fromUnit(channelToken).assetName;
      if (!sender) {
        console.warn(
          `Invalid sender address: ${sender}. Must have a payment key`
        );
        return null;
      }
      if (!utxo.datum) {
        console.warn(
          `Channel UTxO without datum found: ${utxo.txHash}#${utxo.outputIndex}`
        );
        return null;
      }
      try {
        const { channelId, nonce, signer, receiver, groupId, expirationDate } =
          Data.from(utxo.datum, SingularityChannelSpend.datum);
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
      } catch (error) {
        console.warn(
          `Invalid datum found in channel UTxO: ${utxo.txHash}#${utxo.outputIndex}`
        );
        return null;
      }
    })
    .filter((channel) => channel !== null);
};
