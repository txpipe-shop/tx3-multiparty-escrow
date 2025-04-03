import { Data, fromUnit, Hasher, Lucid } from "@spacebudz/lucid";
import { SingularityChannelSpend } from "../types/plutus.ts";
import { ChannelInfo } from "../types/types.ts";

export const getChannelById = async (
  lucid: Lucid,
  channelId: string
): Promise<ChannelInfo> => {
  const validator = new SingularityChannelSpend();
  const scriptAddress = lucid.utils.scriptToAddress(validator);
  const utxos = await lucid.utxosAt(scriptAddress);
  const policyId = Hasher.hashScript(validator);
  const channel = utxos.find((utxo) => {
    if (!utxo.datum) {
      console.warn(
        `Channel UTxO without datum found: ${utxo.txHash}#${utxo.outputIndex}`
      );
      return false;
    }
    try {
      const datum = Data.from(utxo.datum, SingularityChannelSpend.datum);
      return datum.channelId === channelId;
    } catch (error) {
      console.warn(
        `Invalid datum found in channel UTxO: ${utxo.txHash}#${utxo.outputIndex}`
      );
      return false;
    }
  });
  if (!channel) {
    throw new Error(`Channel with id ${channelId} not found`);
  }
  const { assets: balance, txHash, outputIndex } = channel;
  const [channelToken] = Object.keys(balance).filter((key) =>
    key.startsWith(policyId)
  );
  const sender = fromUnit(channelToken).assetName;
  if (!sender) {
    throw new Error(`Invalid sender token name: ${sender}. Utxo: ${txHash}#${outputIndex}`);
  }
  const { nonce, signer, receiver, groupId, expirationDate } = Data.from(
    channel.datum!,
    SingularityChannelSpend.datum
  );
  return {
    txHash,
    outputIndex,
    balance,
    channelId,
    nonce,
    signer,
    receiver,
    sender,
    groupId,
    expirationDate,
    active: Date.now() < expirationDate,
  };
};
