import { Addresses, Crypto, Emulator, Lucid } from "@spacebudz/lucid";
import { generateMnemonic } from "bip39";
import { config } from "../../config.ts";
import { buildMessage } from "../builders/build-message.ts";
import { claim } from "../builders/claim.ts";
import { deployScript } from "../builders/deploy-script.ts";
import { openChannel } from "../builders/open-channel.ts";
import { ChannelValidator } from "../types/types.ts";
import { getCMLPrivateKey, printUtxos, signMessage } from "./utils.ts";

const senderSeed = generateMnemonic(256);
const {
  privateKey: senderPrivKey,
  publicKey: senderPubKey,
  credential: senderCredential,
} = Crypto.seedToDetails(senderSeed, 0, "Payment");
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
    assets: { lovelace: 30_000_000n, [config.token]: 120n },
  },
]);
const lucid = new Lucid({ provider: emulator });
await printUtxos(lucid, receiverAddress);
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

const { openChannelCbor: openChannelCbor1, channelId: channelId1 } =
  await openChannel(
    lucid,
    {
      senderAddress,
      signerPubKey: senderPubKey,
      receiverAddress: receiverAddress,
      initialDeposit: 100n,
      expirationDate: BigInt(Date.now()) + 2n * 24n * 60n * 60n * 1000n,
      groupId: 10n,
    },
    scriptRef,
  );

const tx1 = await lucid.fromTx(openChannelCbor1);
lucid.selectWalletFromPrivateKey(senderPrivKey);
const signedTx1 = await tx1.sign().commit();
const openTx1 = await signedTx1.submit();
await lucid.awaitTx(openTx1);

console.log(`\n
    > Channel opened with ID: ${channelId1}
    > Initial Deposit: 100
    > Tx ID: ${openTx1}
    > CBOR: ${openChannelCbor1}\n\n`);

await printUtxos(lucid, senderAddress);
const validator = new ChannelValidator();
const scriptAddress = lucid.newScript(validator).toAddress();
const utxosAtScript1 = await lucid.utxosAt(scriptAddress);
printUtxos(lucid, undefined, utxosAtScript1);

const { openChannelCbor: openChannelCbor2, channelId: channelId2 } =
  await openChannel(
    lucid,
    {
      senderAddress,
      signerPubKey: senderPubKey,
      receiverAddress: receiverAddress,
      initialDeposit: 20n,
      expirationDate: BigInt(Date.now()) + 2n * 24n * 60n * 60n * 1000n,
      groupId: 9n,
    },
    scriptRef,
  );

const tx2 = await lucid.fromTx(openChannelCbor2);
lucid.selectWalletFromPrivateKey(senderPrivKey);
const signedTx2 = await tx2.sign().commit();
const openTx2 = await signedTx2.submit();
await lucid.awaitTx(openTx2);

console.log(`\n
    > Channel opened with ID: ${channelId2}
    > Initial Deposit: 20
    > Tx ID: ${openTx2}
    > CBOR: ${openChannelCbor2}\n\n`);

await printUtxos(lucid, senderAddress);
await printUtxos(lucid, receiverAddress);
const utxosAtScript2 = await lucid.utxosAt(scriptAddress);
printUtxos(lucid, undefined, utxosAtScript2);

const { payload: payload1ofcId1 } = await buildMessage(lucid, {
  channelId: channelId1,
  amount: 20n,
  senderAddress,
});
const { payload: payload1ofcId2 } = await buildMessage(lucid, {
  channelId: channelId2,
  amount: 20n,
  senderAddress,
});
lucid.selectWalletFromPrivateKey(senderPrivKey);
const privKey = getCMLPrivateKey(senderSeed);
const signature1 = await signMessage(privKey, payload1ofcId1);
const signature2 = await signMessage(privKey, payload1ofcId2);
const { cbor: claimCbor } = await claim(
  lucid,
  [
    {
      senderAddress,
      channelId: channelId1,
      finalize: false,
      amount: 20n,
      signature: signature1,
    },
    {
      senderAddress,
      channelId: channelId2,
      finalize: true,
      amount: 10n,
      signature: signature2,
    },
  ],
  scriptRef,
  BigInt(Date.now()),
  receiverAddress,
);

lucid.selectWalletFromPrivateKey(senderPrivKey);
const claimTx = await lucid
  .fromTx(claimCbor)
  .then((txComp) => txComp.sign().commit())
  .then((txSigned) => txSigned.submit());
await lucid.awaitTx(claimTx);

console.log(`\n
    > Channels claimed with
    > Tx ID: ${claimTx}
    > CBOR: ${claimCbor}
    > Channel IDs and Amounts:
      > ID: ${channelId1}
      > Claimed: 20

      > ID: ${channelId2}
      > Claimed: 10\n\n`);

const finalUtxosAtScript = await lucid.utxosAt(scriptAddress);
printUtxos(lucid, senderAddress);
await printUtxos(lucid, receiverAddress);
printUtxos(lucid, undefined, finalUtxosAtScript);

// Claim and close
const { payload: payload2ofcId1 } = await buildMessage(lucid, {
  channelId: channelId1,
  amount: 60n,
  senderAddress,
});
lucid.selectWalletFromPrivateKey(senderPrivKey);

const signature3 = await signMessage(privKey, payload2ofcId1);
const { cbor: claimCbor2 } = await claim(
  lucid,
  [
    {
      senderAddress,
      channelId: channelId1,
      finalize: true,
      amount: 60n,
      signature: signature3,
    },
  ],
  scriptRef,
  BigInt(Date.now()),
  receiverAddress,
);

lucid.selectWalletFromPrivateKey(senderPrivKey);
const claimTx2 = await lucid
  .fromTx(claimCbor2)
  .then((txComp) => txComp.sign().commit())
  .then((txSigned) => txSigned.submit());
await lucid.awaitTx(claimTx2);

console.log(`\n
    > Channel claimed with ID: ${channelId1}
    > Claimed: 60
    > Tx ID: ${claimTx2}
    > CBOR: ${claimCbor2}\n\n`);

const finalUtxosAtScript2 = await lucid.utxosAt(scriptAddress);
printUtxos(lucid, senderAddress);
await printUtxos(lucid, receiverAddress);
printUtxos(lucid, undefined, finalUtxosAtScript2);
