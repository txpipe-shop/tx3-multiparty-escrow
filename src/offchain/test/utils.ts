import { fromHex, Lucid, Network, toHex, Utxo } from "@spacebudz/lucid";
import { ChannelInfo } from "../types/types.ts";
import {
  Bip32PrivateKey,
  PrivateKey,
} from "@dcspark/cardano-multiplatform-lib-nodejs";
import { mnemonicToEntropy } from "bip39";

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

export const signMessage = async (
  privKey: PrivateKey,
  message: string,
): Promise<string> => {
  const msg = Buffer.from(message, "hex");
  const signedMessage = privKey.sign(msg).to_raw_bytes();
  return toHex(signedMessage);
};

export const getCMLPrivateKey = (
  seed: string,
  options: {
    password?: string;
    addressType?: "Base" | "Enterprise";
    accountIndex?: number;
    network?: Network;
  } = { addressType: "Base", accountIndex: 0, network: "Mainnet" },
): PrivateKey => {
  function harden(num: number): number {
    if (typeof num !== "number") throw new Error("Type number required here!");
    return 0x80000000 + num;
  }

  const entropy = mnemonicToEntropy(seed);
  const rootKey = Bip32PrivateKey.from_bip39_entropy(
    fromHex(entropy),
    options.password
      ? new TextEncoder().encode(options.password)
      : new Uint8Array(),
  );

  const accountKey = rootKey
    .derive(harden(1852))
    .derive(harden(1815))
    .derive(harden(options.accountIndex!));

  const paymentKey = accountKey.derive(0).derive(0).to_raw_key();
  return paymentKey;
};
