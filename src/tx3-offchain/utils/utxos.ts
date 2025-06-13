import {
  AssetId,
  PlutusData,
  TransactionUnspentOutput,
} from "@blaze-cardano/core";
import { parse } from "@blaze-cardano/data";
import { config } from "../../config.ts";
import { Datum, SingularityChannelMint } from "../blueprint.ts";
import { bech32ToPubKeyHash } from "./string.ts";

export const getCollateralUtxo = async (utxos: TransactionUnspentOutput[]) => {
  return utxos.filter((u) => {
    const value = u.toCore()[1].value;
    return value.coins && value.coins <= 5_000_000n && value.assets?.size === 0;
  })[0];
};

export const getSuitableUtxos = (
  utxos: TransactionUnspentOutput[],
  amount: number,
) => {
  const retUtxos = utxos
    .filter((u) => {
      const value = u.toCore()[1].value;
      return (
        value.coins &&
        value.coins >= 20_000_000n &&
        (value.assets?.get(AssetId(config.token)) ?? 0) >= amount
      );
    })
    .sort((a, b) => {
      const aLex = `${a.toCore()[0].txId}${a.toCore()[0].index}`;
      const bLex = `${b.toCore()[0].txId}${b.toCore()[0].index}`;
      if (aLex < bLex) return -1;
      return 1;
    });
  return retUtxos;
};

export const getChannelUtxo = (
  utxos: TransactionUnspentOutput[],
  sender: string,
  channelId: string,
) => {
  const senderPubKeyHash = bech32ToPubKeyHash(sender);
  const scriptHash = new SingularityChannelMint().Script.hash();
  const channelToken = scriptHash + senderPubKeyHash;
  return utxos
    .filter((u) => {
      const value = u.output().toCore().value;
      return value.assets?.get(AssetId(channelToken));
    })
    .filter((u) => {
      try {
        const parsedDatum = parse(
          Datum,
          PlutusData.fromCore(u.output().toCore().datum!),
        );
        return parsedDatum.channel_id === channelId;
      } catch (e) {
        console.warn(e);
        return false;
      }
    });
};
