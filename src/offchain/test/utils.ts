import { Lucid, toText, Utxo } from "@spacebudz/lucid";
import { ChannelInfo } from "../types/types.ts";

const parseAssets = (walletUtxo: Utxo) => {
  return Object.fromEntries(
    Object.entries(walletUtxo.assets).map(([key, value]) => {
      const newKey = key.slice(0, 56) + " " + toText(key.slice(56));
      return [newKey, typeof value === "bigint" ? value.toString() : value];
    })
  );
};
const maxLength = 70;
const parseUtxos = (utxos: Utxo[]) =>
  JSON.stringify(
    utxos.map((utxo) => ({
      ...utxo,
      assets: parseAssets(utxo),
    })),
    (_, value) => {
      if (typeof value === "bigint") return value.toString();
      else if (typeof value === "string" && value.length > maxLength)
        return value.slice(0, maxLength) + "...";
      return value;
    },
    4
  );

export const printUtxos = async (
  lucid: Lucid,
  address?: string,
  utxos?: Utxo[]
) => {
  address && lucid.selectReadOnlyWallet({ address });
  const walletUtxos = utxos ?? (await lucid.wallet.getUtxos());
  const title = address ? "WALLET UTXOS" : "SCRIPT UTXOS";
  console.log(`-------------------------${title}------------------------------
${parseUtxos(walletUtxos)}
------------------------------------------------------------------`);
};

export const pprintChannels = (
  header: string,
  channels: ChannelInfo[] | ChannelInfo
) => {
  const pad = (text: string, length = 80, padChar = "-") => {
    const padLength = Math.max(0, (length - text.length) / 2);
    const pad = padChar.repeat(Math.floor(padLength));
    return `<<<<<<${pad}${text}${pad}>>>>>>`;
  };
  console.log(pad(header, 80));
  console.dir(channels, { depth: null });
  console.log(`${pad("", 80)}\n`);
};
