import { buildMessage } from "../builders/build-message.ts";
import { testOpenOperation } from "./operations.ts";
import { getCMLPrivateKey, setupTestEnv, signMessage } from "./utils.ts";

const { sender, signer, receiver, lucid, emulator, scriptRef } =
  await setupTestEnv();
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
  false,
);

const { payload } = await buildMessage(lucid, {
  channelId,
  amount: 3n,
  senderAddress: sender.address,
});

lucid.selectWalletFromPrivateKey(signer.privateKey);
const privKey = getCMLPrivateKey(signer.seed);
const signature = await signMessage(privKey, payload);

console.log("\n\nSigned Message:");
console.log(signature);
