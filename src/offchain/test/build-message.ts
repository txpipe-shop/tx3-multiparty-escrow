import { Addresses, Crypto, Emulator, Lucid } from "@spacebudz/lucid";
import { generateMnemonic } from "bip39";
import { config } from "../../config.ts";
import { buildMessage } from "../builders/build-message.ts";
import { deployScript } from "../builders/deploy-script.ts";
import { openChannel } from "../builders/open-channel.ts";
import { SingularityChannelMint } from "../types/plutus.ts";
import { printUtxos } from "./utils.ts";

const {
  privateKey: senderPrivKey,
  publicKey: senderPubKey,
  credential: senderCredential,
} = Crypto.seedToDetails(generateMnemonic(256), 0, "Payment");
const senderAddress = Addresses.credentialToAddress(
  { Emulator: 0 },
  senderCredential,
);

const { privateKey: receiverPrivKey } = Crypto.seedToDetails(
  generateMnemonic(256),
  0,
  "Payment",
);
const receiverAddress = Addresses.credentialToAddress(
  { Emulator: 0 },
  Crypto.privateKeyToDetails(receiverPrivKey).credential,
);

const emulator = new Emulator([
  {
    address: senderAddress,
    assets: { lovelace: 3000000000n, [config.token]: 12n },
  },
]);
const lucid = new Lucid({ provider: emulator });

await printUtxos(lucid, senderAddress);
const { cbor } = await deployScript(lucid);
lucid.selectWalletFromPrivateKey(senderPrivKey);
const txDeployHash = await lucid
  .fromTx(cbor)
  .then((txComp) => txComp.sign().commit())
  .then((txSigned) => txSigned.submit());
await lucid.awaitTx(txDeployHash);
const [scriptRef] = await lucid.utxosByOutRef([
  { txHash: txDeployHash, outputIndex: 0 },
]);

const { openChannelCbor, channelId } = await openChannel(
  lucid,
  {
    senderAddress,
    signerPubKey: senderPubKey,
    receiverAddress: receiverAddress,
    initialDeposit: 6n,
    expirationDate: 2n,
    groupId: 10n,
  },
  scriptRef,
);
lucid.selectWalletFromPrivateKey(senderPrivKey);
const tx = await lucid.fromTx(openChannelCbor);
const signedTx = await tx.sign().commit();
const openTx = await signedTx.submit();
await lucid.awaitTx(openTx);

console.log(`\n
    > Channel opened with ID: ${channelId}
    > Initial Deposit: 6
    > Tx ID: ${openTx}
    > CBOR: ${openChannelCbor}\n\n`);

await printUtxos(lucid, senderAddress);
const validator = new SingularityChannelMint();
const scriptAddress = lucid.newScript(validator).toAddress();
const utxoAtScript = await lucid.utxosAt(scriptAddress);
printUtxos(lucid, undefined, utxoAtScript);

const { payload } = await buildMessage(lucid, {
  channelId,
  amount: 3n,
  senderAddress,
});

lucid.selectWalletFromPrivateKey(senderPrivKey);
const message = await lucid.wallet.signMessage(senderAddress, payload);

console.log("\n\nSigned Message:");
console.log(message);
