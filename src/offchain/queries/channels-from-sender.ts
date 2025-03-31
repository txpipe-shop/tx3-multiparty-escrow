import { Addresses, Data, Hasher, Lucid } from "@spacebudz/lucid";
import { SingularityChannelSpend } from "../types/plutus.ts";
import { ChannelInfo } from "../types/types.ts";

export const getChannelsFromSender = async (
  lucid: Lucid,
  senderAddr: string
): Promise<ChannelInfo[]> => {
  const validator = new SingularityChannelSpend();
  const scriptAddress = lucid.utils.scriptToAddress(validator);
  const utxos = await lucid.utxosAt(scriptAddress);
  const policyId = Hasher.hashScript(validator);
  const senderKey = Addresses.inspect(senderAddr).payment;
  if (!senderKey) {
    throw new Error(
      `Invalid sender address: ${senderAddr}. Must have a payment key`
    );
  }
  const sender = senderKey.hash;
  const channelToken = `${policyId}${sender}`;

  return utxos
    .filter((utxo) => {
      return utxo.assets[channelToken] === 1n;
    })
    .map((utxo) => {
      const { assets: balance, txHash, outputIndex } = utxo;
      if (!utxo.datum) {
        console.warn(
          `Channel UTxO without datum found: ${utxo.txHash}#${utxo.outputIndex}`
        );
        return null;
      }
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
    })
    .filter((channel) => channel !== null);
};
