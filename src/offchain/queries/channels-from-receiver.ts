import { Addresses, fromUnit, Hasher, Lucid } from "@spacebudz/lucid";
import { ChannelValidator, ChannelInfo } from "../types/types.ts";
import { fromChannelDatum } from "../lib/utils.ts";

export const getChannelsFromReceiver = async (
  lucid: Lucid,
  receiverAddr: string
): Promise<ChannelInfo[]> => {
  const validator = new ChannelValidator();
  const scriptAddress = lucid.utils.scriptToAddress(validator);
  const utxos = await lucid.utxosAt(scriptAddress);
  const policyId = Hasher.hashScript(validator);
  const receiverKey = Addresses.inspect(receiverAddr).payment;
  if (!receiverKey) {
    throw new Error(
      `Invalid receiver address: ${receiverAddr}. Must have a payment key`
    );
  }

  return utxos
    .map((utxo) => {
      const { assets: balance, txHash, outputIndex } = utxo;
      if (!utxo.datum) {
        console.warn(
          `Channel UTxO without datum found: ${utxo.txHash}#${utxo.outputIndex}`
        );
        return null;
      }
      try {
        const { channelId, nonce, signer, receiver, groupId, expirationDate } =
          fromChannelDatum(utxo.datum);
        const [channelToken] = Object.keys(balance).filter((key) =>
          key.startsWith(policyId)
        );
        const sender = fromUnit(channelToken).assetName;
        if (!sender) {
          console.warn(
            `Invalid sender asset name: ${sender}. Utxo: ${txHash}#${outputIndex}`
          );
          return null;
        }
        if (receiver !== receiverKey.hash) {
          return null;
        }
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
