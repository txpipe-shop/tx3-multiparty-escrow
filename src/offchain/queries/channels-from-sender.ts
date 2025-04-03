import { Addresses, Hasher, Lucid } from "@spacebudz/lucid";
import { ChannelValidator, ChannelInfo } from "../types/types.ts";
import { fromChannelDatum } from "../lib/utils.ts";

export const getChannelsFromSender = async (
  lucid: Lucid,
  senderAddr: string
): Promise<ChannelInfo[]> => {
  const validator = new ChannelValidator();
  const scriptAddress = lucid.utils.scriptToAddress(validator);
  const policyId = Hasher.hashScript(validator);
  const senderKey = Addresses.inspect(senderAddr).payment;
  if (!senderKey) {
    throw new Error(
      `Invalid sender address: ${senderAddr}. Must have a payment key`
    );
  }
  const sender = senderKey.hash;
  const channelToken = `${policyId}${sender}`;

  return await lucid
    .utxosAtWithUnit(scriptAddress, channelToken)
    .then((utxos) =>
      utxos
        .map((utxo) => {
          const { assets: balance, txHash, outputIndex } = utxo;
          if (!utxo.datum) {
            console.warn(
              `Channel UTxO without datum found: ${utxo.txHash}#${utxo.outputIndex}`
            );
            return null;
          }
          try {
            const {
              channelId,
              nonce,
              signer,
              receiver,
              groupId,
              expirationDate,
            } = fromChannelDatum(utxo.datum);
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
        .filter((channel) => channel !== null)
    );
};
