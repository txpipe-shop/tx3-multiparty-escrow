import { buildMessage } from "../builders/build-message.ts";
import {
  testClaimOperation,
  testCloseChannel,
  testOpenOperation,
  testUpdateOperation,
} from "./operations.ts";
import {
  getCMLPrivateKey,
  printUtxos,
  setupTestEnv,
  signMessage,
} from "./utils.ts";

const { sender, signer, receiver, lucid, emulator, scriptRef } =
  await setupTestEnv();
await printUtxos(lucid, sender.address);

const { channelId } = await testOpenOperation(
  {
    lucid,
    scriptRef,
    senderAddress: sender.address,
    receiverAddress: receiver.address,
    signerPubKey: signer.publicKey,
    groupId: "group1",
    expirationDate: BigInt(emulator.now() + 40 * 1000),
    initialDeposit: 6n,
    currentTime: BigInt(emulator.now()),
  },
  sender.privateKey,
);

await testUpdateOperation(
  {
    lucid,
    scriptRef,
    userAddress: sender.address,
    senderAddress: sender.address,
    channelId,
    addDeposit: 30n,
    currentTime: BigInt(emulator.now()),
  },
  sender.privateKey,
);

const { payload } = await buildMessage(lucid, {
  channelId,
  amount: 20n,
  senderAddress: sender.address,
});
lucid.selectWalletFromPrivateKey(signer.privateKey);
const privKey = getCMLPrivateKey(signer.seed);
const signature = await signMessage(privKey, payload);

console.log("\n\nSigned Message:");
console.log(signature);

await testClaimOperation(
  {
    lucid,
    listOfClaims: [
      {
        senderAddress: sender.address,
        channelId,
        finalize: false,
        amount: 20n,
        signature,
      },
    ],
    scriptRef,
    currentTime: BigInt(emulator.now()),
    receiverAddress: receiver.address,
  },
  receiver.privateKey,
);
await printUtxos(lucid, sender.address);

await testCloseChannel(
  {
    lucid,
    scriptRef,
    senderAddress: sender.address,
    channelId,
    currentTime: BigInt(emulator.now() + 41 * 1000),
  },
  sender.privateKey,
);
