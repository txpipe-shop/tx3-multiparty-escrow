import { Emulator, Lucid } from "@spacebudz/lucid";
import { config } from "../../config.ts";
import { buildMessage } from "../builders/build-message.ts";
import {
  testClaimOperation,
  testCloseChannel,
  testOpenOperation,
  testUpdateOperation,
} from "./operations.ts";
import {
  getCMLPrivateKey,
  getRandomUser,
  getScriptRef,
  printUtxos,
  signMessage,
} from "./utils.ts";

const {
  privateKey: senderPrivKey,
  publicKey: senderPubKey,
  address: senderAddress,
  seed: senderSeed,
} = getRandomUser();

const { address: receiverAddress } = getRandomUser();

const emulator = new Emulator([
  {
    address: senderAddress,
    assets: { lovelace: 30_000_000n, [config.token]: 12n },
  },
]);
const lucid = new Lucid({ provider: emulator });
await printUtxos(lucid, senderAddress);

const scriptRef = await getScriptRef(lucid, senderPrivKey);

const { channelId } = await testOpenOperation(
  {
    lucid,
    scriptRef,
    senderAddress,
    receiverAddress,
    signerPubKey: senderPubKey,
    groupId: 10n,
    expirationDate: BigInt(Date.now() + 80 * 1000),
    initialDeposit: 6n,
  },
  senderPrivKey
);

await testUpdateOperation(
  {
    lucid,
    scriptRef,
    userAddress: senderAddress,
    senderAddress,
    channelId,
    addDeposit: 3n,
    currentTime: BigInt(Date.now() + 20 * 1000),
  },
  senderPrivKey
);

const { payload } = await buildMessage(lucid, {
  channelId,
  amount: 20n,
  senderAddress,
});
lucid.selectWalletFromPrivateKey(senderPrivKey);
const privKey = getCMLPrivateKey(senderSeed);
const signature = await signMessage(privKey, payload);

console.log("\n\nSigned Message:");
console.log(signature);

await testClaimOperation(
  {
    lucid,
    listOfClaims: [
      {
        senderAddress,
        channelId,
        finalize: false,
        amount: 7n,
        signature,
      },
    ],
    scriptRef,
    currentTime: BigInt(Date.now() + 40 * 1000),
    receiverAddress,
  },
  senderPrivKey
);
await printUtxos(lucid, senderAddress);

await testCloseChannel(
  {
    lucid,
    scriptRef,
    senderAddress,
    channelId,
    currentTime: BigInt(Date.now() + 85 * 1000),
  },
  senderPrivKey
);
