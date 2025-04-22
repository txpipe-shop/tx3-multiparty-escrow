import {
  Bip32PrivateKey,
  PrivateKey,
} from "@dcspark/cardano-multiplatform-lib-nodejs";
import {
  Addresses,
  Crypto,
  Emulator,
  fromHex,
  Lucid,
  Network,
  toHex,
  Utxo,
} from "@spacebudz/lucid";
import { generateMnemonic, mnemonicToEntropy } from "bip39";
import { deployScript } from "../builders/deploy-script.ts";
import { ChannelInfo } from "../types/types.ts";
import { config } from "../../config.ts";

const pad = (text = "", length = 120, padChar = "-") => {
  const padLength = Math.max(0, (length - text.length) / 2);
  const pad = padChar.repeat(Math.floor(padLength));
  return `<<<<<<${pad}${text}${pad}>>>>>>`;
};

export const printUtxos = async (
  lucid: Lucid,
  address?: string,
  utxos?: Utxo[]
) => {
  if (address) lucid.selectReadOnlyWallet({ address });
  const walletUtxos = utxos ?? (await lucid.wallet.getUtxos());
  const title = address ? `WALLET UTXOS [${address}]` : `SCRIPT UTXOS`;
  console.log("\x1b[34m%s\x1b[0m", pad(title));
  console.dir(walletUtxos, { depth: null });
  console.log("\x1b[34m%s\x1b[0m", pad());
};

export const printChannels = (
  header: string,
  channels: ChannelInfo[] | ChannelInfo
) => {
  console.log("\x1b[34m%s\x1b[0m", pad(header));
  console.dir(channels, { depth: null });
  console.log("\x1b[34m%s\x1b[0m", pad());
};

export const signMessage = async (
  privKey: PrivateKey,
  message: string
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
  } = { addressType: "Base", accountIndex: 0, network: "Mainnet" }
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
      : new Uint8Array()
  );

  const accountKey = rootKey
    .derive(harden(1852))
    .derive(harden(1815))
    .derive(harden(options.accountIndex!));

  const paymentKey = accountKey.derive(0).derive(0).to_raw_key();
  return paymentKey;
};

export const signAndSubmit = async (
  lucid: Lucid,
  privKey: string,
  cbor: string
) => {
  lucid.selectWalletFromPrivateKey(privKey);
  const txToSign = await lucid.fromTx(cbor);
  const signedTx = await txToSign.sign().commit();
  const tx = await signedTx.submit();
  await lucid.awaitTx(tx);
  return tx;
};

export const getScriptRef = async (lucid: Lucid, privKey: string) => {
  let deployHash = "";
  const { txHash } = config.ref_script;
  if (typeof lucid.provider.network === "object" || !txHash) {
    const { cbor } = await deployScript(lucid);
    lucid.selectWalletFromPrivateKey(privKey);
    deployHash = await lucid
      .fromTx(cbor)
      .then((txComp) => txComp.sign().commit())
      .then((txSigned) => txSigned.submit());
    await lucid.awaitTx(deployHash);
  } else {
    deployHash = txHash;
  }
  const [scriptRef] = await lucid.utxosByOutRef([
    { txHash: deployHash, outputIndex: 0 },
  ]);
  return scriptRef;
};

export const getRandomUser = () => {
  const seed = generateMnemonic(256);
  const { privateKey, publicKey, credential } = Crypto.seedToDetails(
    seed,
    0,
    "Payment"
  );
  const address = Addresses.credentialToAddress({ Emulator: 0 }, credential);
  return { privateKey, publicKey, address, pubKeyHash: credential.hash, seed };
};
