import { Addresses, Crypto, Emulator, Lucid } from "@spacebudz/lucid";
import { generateMnemonic } from "bip39";
import { config } from "../../config.ts";
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
    assets: { lovelace: 10_000_000n, [config.token]: 12n },
  },
]);
const lucid = new Lucid({ provider: emulator });
printUtxos(lucid, senderAddress);

const { openChannelCbor, channelId } = await openChannel(lucid, {
  senderAddress,
  signerPubKey: senderPubKey,
  receiverAddress: receiverAddress,
  initialDeposit: 6n,
  expirationDate: 2n,
  groupId: 10n,
});
lucid.selectWalletFromPrivateKey(senderPrivKey);
const tx = await lucid.fromTx(openChannelCbor);
const signedTx = await tx.sign().commit();
const openTx = await signedTx.submit();
await lucid.awaitTx(openTx);

console.log(`\n
    > Channel opened with ID: ${channelId}
    > Initial Deposit: 6
    > Tx ID: ${openTx}\n\n`);

printUtxos(lucid, senderAddress);
const validator = new SingularityChannelMint();
const scriptAddress = lucid.newScript(validator).toAddress();
const utxosAtScript = await lucid.utxosAt(scriptAddress);
printUtxos(lucid, undefined, utxosAtScript);
