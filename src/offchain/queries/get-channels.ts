import { Assets, Lucid, OutRef } from "@spacebudz/lucid";
import { SingularityChannelSpend, TypesDatum } from "../types/plutus.ts";

export type ChannelInfo = OutRef &
  TypesDatum & { balance: Assets; active: boolean };

export const getChannels = async (lucid: Lucid) => {
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
