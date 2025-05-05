import { testOpenOperation, testUpdateOperation } from "./operations.ts";
import { printUtxos, setupTestEnv } from "./utils.ts";

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
    expirationDate: BigInt(emulator.now() + 2 * 24 * 60 * 60 * 1000),
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
    addDeposit: 3n,
    expirationDate: BigInt(emulator.now() + 5 * 24 * 60 * 60 * 1000),
    currentTime: BigInt(emulator.now() + 4 * 60 * 60 * 1000),
  },
  sender.privateKey,
);
