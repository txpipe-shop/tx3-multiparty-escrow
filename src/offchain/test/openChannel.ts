import { Addresses, Crypto, Emulator, Lucid } from "@spacebudz/lucid";
import { config } from "../../config.ts";
import { openChannel } from "../builders/open-channel.ts";
import { SingularityChannelMint } from "../types/plutus.ts";
import { printUtxos } from "./utils.ts";

const senderPrivKey = Crypto.generatePrivateKey();
const senderAddress = Addresses.credentialToAddress(
  { Emulator: 0 },
  Crypto.privateKeyToDetails(senderPrivKey).credential
);

const senderPubKey = Crypto.privateKeyToDetails(senderPrivKey).publicKey;

const providerPrivKey = Crypto.generatePrivateKey();
const providerAddress = Addresses.credentialToAddress(
  { Emulator: 0 },
  Crypto.privateKeyToDetails(providerPrivKey).credential
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
  receiverAddress: providerAddress,
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
const utxoAtScript = await lucid.utxosAt(scriptAddress);
printUtxos(lucid, undefined, utxoAtScript);
