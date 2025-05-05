import { testCloseChannel, testOpenOperation } from "./operations.ts";
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
    expirationDate: BigInt(emulator.now() + 10 * 1000),
    initialDeposit: 6n,
    currentTime: BigInt(emulator.now()),
  },
  sender.privateKey,
);

await testCloseChannel(
  {
    lucid,
    scriptRef,
    senderAddress: sender.address,
    channelId,
    currentTime: BigInt(emulator.now() + 11 * 1000),
  },
  sender.privateKey,
);
