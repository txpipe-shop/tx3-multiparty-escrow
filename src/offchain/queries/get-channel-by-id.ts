import { Data, Lucid } from "@spacebudz/lucid";
import { SingularityChannelSpend } from "../types/plutus.ts";
import { ChannelInfo } from "../types/types.ts";

export const getChannelById = async (
  lucid: Lucid,
  channelId: string
): Promise<ChannelInfo> => {
  const validator = new SingularityChannelSpend();
  const scriptAddress = lucid.utils.scriptToAddress(validator);
  const utxos = await lucid.utxosAt(scriptAddress);
  const channel = utxos.find((utxo) => {
    if (!utxo.datum) {
      console.warn(`Channel UTxO without datum found: ${utxo.txHash}#${utxo.outputIndex}`);
      return false;
    }
    const datum = Data.from(utxo.datum, SingularityChannelSpend.datum);
    return datum.channelId === channelId;
  });
  if (!channel) {
    throw new Error(`Channel with id ${channelId} not found`);
  }
  const { assets: balance } = channel;
  const { nonce, signer, receiver, groupId, expirationDate } =
    Data.from(channel.datum!, SingularityChannelSpend.datum);
  return {
    balance,
    channelId,
    nonce,
    signer,
    receiver,
    groupId,
    expirationDate,
    active: Date.now() < expirationDate,
  };
};
