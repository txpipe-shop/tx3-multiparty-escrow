import { Addresses, Crypto, Emulator, Lucid } from "@spacebudz/lucid";
import { generateMnemonic } from "bip39";
import { config } from "../../config.ts";
import { deployScript } from "../builders/deploy-script.ts";
import { openChannel } from "../builders/open-channel.ts";
import { ChannelValidator } from "../types/types.ts";
import { getCMLPrivateKey, printUtxos, signMessage } from "./utils.ts";
import { claim } from "../builders/claim.ts";
import { buildMessage } from "../builders/build-message.ts";

const senderSeed = generateMnemonic(256);
const {
  privateKey: senderPrivKey,
  publicKey: senderPubKey,
  credential: senderCredential,
} = Crypto.seedToDetails(senderSeed, 0, "Payment");
const senderAddress = Addresses.credentialToAddress(
  { Emulator: 0 },
  senderCredential
);

const { privateKey: receiverPrivKey } = Crypto.seedToDetails(
  generateMnemonic(256),
  0,
  "Payment"
);
const receiverAddress = Addresses.credentialToAddress(
  { Emulator: 0 },
  Crypto.privateKeyToDetails(receiverPrivKey).credential
);

const emulator = new Emulator([
  {
    address: senderAddress,
    assets: { lovelace: 3000000000n, [config.token]: 120000n },
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
    initialDeposit: 600n,
    expirationDate: BigInt(Date.now()) + 2n * 24n * 60n * 60n * 1000n,
    groupId: 10n,
  },
  scriptRef
);

const tx = await lucid.fromTx(openChannelCbor);
lucid.selectWalletFromPrivateKey(senderPrivKey);
const signedTx = await tx.sign().commit();
const openTx = await signedTx.submit();
await lucid.awaitTx(openTx);

console.log(`\n
    > Channel opened with ID: ${channelId}
    > Initial Deposit: 6
    > Tx ID: ${openTx}
    > CBOR: ${openChannelCbor}\n\n`);

await printUtxos(lucid, senderAddress);
const validator = new ChannelValidator();
const scriptAddress = lucid.newScript(validator).toAddress();
const utxosAtScript = await lucid.utxosAt(scriptAddress);
printUtxos(lucid, undefined, utxosAtScript);

// Normal claim
const { payload } = await buildMessage(lucid, {
  channelId,
  amount: 20n,
  senderAddress,
});
lucid.selectWalletFromPrivateKey(senderPrivKey);

const privKey = getCMLPrivateKey(senderSeed);
const signature = await signMessage(privKey, payload);
const { cbor: claimCbor } = await claim(
  lucid,
  {
    receiverAddress,
    senderAddress,
    channelId,
    finalize: false,
    amount: 20n,
    signature,
  },
  scriptRef,
  BigInt(Date.now())
);

lucid.selectWalletFromPrivateKey(senderPrivKey);
const claimTx = await lucid
  .fromTx(claimCbor)
  .then((txComp) => txComp.sign().commit())
  .then((txSigned) => txSigned.submit());
await lucid.awaitTx(claimTx);

console.log(`\n
    > Channel claimed with ID: ${channelId}
    > Claimed: 20
    > Tx ID: ${claimTx}
    > CBOR: ${claimCbor}\n\n`);

const finalUtxosAtScript = await lucid.utxosAt(scriptAddress);
printUtxos(lucid, senderAddress);
printUtxos(lucid, undefined, finalUtxosAtScript);


// Claim and close
const { payload: payload2 } = await buildMessage(lucid, {
  channelId,
  amount: 60n,
  senderAddress,
});
lucid.selectWalletFromPrivateKey(senderPrivKey);

const signature2 = await signMessage(privKey, payload);
const { cbor: claimCbor2 } = await claim(
  lucid,
  {
    receiverAddress,
    senderAddress,
    channelId,
    finalize: true,
    amount: 60n,
    signature: signature2,
  },
  scriptRef,
  BigInt(Date.now())
);

lucid.selectWalletFromPrivateKey(senderPrivKey);
const claimTx2 = await lucid
  .fromTx(claimCbor2)
  .then((txComp) => txComp.sign().commit())
  .then((txSigned) => txSigned.submit());
await lucid.awaitTx(claimTx2);

console.log(`\n
    > Channel claimed with ID: ${channelId}
    > Claimed: 20
    > Tx ID: ${claimTx2}
    > CBOR: ${claimCbor2}\n\n`);

const finalUtxosAtScript2 = await lucid.utxosAt(scriptAddress);
printUtxos(lucid, senderAddress);
printUtxos(lucid, undefined, finalUtxosAtScript2);
