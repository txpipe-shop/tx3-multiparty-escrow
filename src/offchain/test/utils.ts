import { Lucid, Utxo } from "@spacebudz/lucid";
import { ChannelInfo } from "../types/types.ts";

const pad = (text = "", length = 80, padChar = "-") => {
  const padLength = Math.max(0, (length - text.length) / 2);
  const pad = padChar.repeat(Math.floor(padLength));
  return `<<<<<<${pad}${text}${pad}>>>>>>`;
};

export const printUtxos = async (
  lucid: Lucid,
  address?: string,
  utxos?: Utxo[],
) => {
  if (address) lucid.selectReadOnlyWallet({ address });
  const walletUtxos = utxos ?? (await lucid.wallet.getUtxos());
  const title = address ? "WALLET UTXOS" : "SCRIPT UTXOS";
  console.log(pad(title));
  console.dir(walletUtxos, { depth: null });
  console.log(pad());
};

export const printChannels = (
  header: string,
  channels: ChannelInfo[] | ChannelInfo,
) => {
  console.log(pad(header));
  console.dir(channels, { depth: null });
  console.log(pad());
};
