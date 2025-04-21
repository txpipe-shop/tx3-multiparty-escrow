import { fromUnit, Lucid } from "@spacebudz/lucid";
import { fromChannelDatum, validatorDetails } from "../lib/utils.ts";
import { ChannelInfo } from "../types/types.ts";

export const getChannelById = async (
  lucid: Lucid,
  channelId: string,
): Promise<ChannelInfo> => {
  const { scriptAddress, scriptHash: policyId } = validatorDetails(lucid);
  const utxos = await lucid.utxosAt(scriptAddress);

  const channel = utxos.find((utxo) => {
    if (!utxo.datum) {
      console.warn(
        `Channel UTxO without datum found: ${utxo.txHash}#${utxo.outputIndex}`,
      );
      return false;
    }
    try {
      const datum = fromChannelDatum(utxo.datum);
      return datum.channelId === channelId;
    } catch (_) {
      console.warn(
        `Invalid datum found in channel UTxO: ${utxo.txHash}#${utxo.outputIndex}`,
      );
      return false;
    }
  });
  if (!channel) {
    throw new Error(`Channel with id ${channelId} not found`);
  }
  const { assets: balance, txHash, outputIndex } = channel;
  const [channelToken] = Object.keys(balance).filter((key) =>
    key.startsWith(policyId),
  );
  const sender = fromUnit(channelToken).assetName;
  if (!sender) {
    throw new Error(
      `Invalid sender token name: ${sender}. Utxo: ${txHash}#${outputIndex}`,
    );
  }
  const { nonce, signer, receiver, groupId, expirationDate } = fromChannelDatum(
    channel.datum!,
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
