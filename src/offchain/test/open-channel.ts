import { Addresses, Crypto, Emulator, Lucid } from "@spacebudz/lucid";
import { generateMnemonic } from "bip39";
import { config } from "../../config.ts";
import { openChannel } from "../builders/open-channel.ts";
import { getAllChannels } from "../queries/all-channels.ts";
import { pprintChannels, printUtxos } from "./utils.ts";
import { getChannelsFromSender } from "../queries/channels-from-sender.ts";
import { getChannelsFromReceiver } from "../queries/channels-from-receiver.ts";
import { getChannelById } from "../queries/channel-by-id.ts";
import { deployScript } from "../builders/deploy-script.ts";

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
    assets: { lovelace: 10_000_000n, [config.token]: 12n },
  },
]);
const lucid = new Lucid({ provider: emulator });
await printUtxos(lucid, senderAddress);

pprintChannels("GET ALL CHANNELS BEFORE TX", await getAllChannels(lucid));

const { cbor } = await deployScript(lucid);
lucid.selectWalletFromPrivateKey(senderPrivKey);
const txDeployHash = await lucid
  .fromTx(cbor)
  .then((txComp) => {
    return txComp.sign().commit();
  })
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

pprintChannels("GET SENDERS CHANNELS AFTER TX", await getChannelsFromSender(lucid, senderAddress));
pprintChannels("GET CHANNEL BY ID", await getChannelById(lucid, channelId));
pprintChannels("GET CHANNELS FROM RECEIVER", await getChannelsFromReceiver(lucid, receiverAddress));
