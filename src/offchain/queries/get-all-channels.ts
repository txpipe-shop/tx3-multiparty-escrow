import { Lucid } from "@spacebudz/lucid";
import { SingularityChannelSpend } from "../types/plutus.ts";
import { ChannelInfo } from "../types/types.ts";

export const getAllChannels = async (lucid: Lucid): Promise<ChannelInfo[]> => {
  const validator = new SingularityChannelSpend();
  const scriptAddress = lucid.utils.scriptToAddress(validator);
  const utxos = await lucid.utxosAt(scriptAddress);

  return await Promise.all(
    utxos.map(async (utxo) => {
      const { assets: balance } = utxo;
      const { channelId, nonce, signer, receiver, groupId, expirationDate } =
        await lucid.datumOf(utxo, SingularityChannelSpend.datum);
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
    })
  );
};
