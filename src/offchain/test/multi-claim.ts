import { buildMessage } from "../builders/build-message.ts";
import { testClaimOperation, testOpenOperation } from "./operations.ts";
import {
  getCMLPrivateKey,
  printUtxos,
  setupTestEnv,
  signMessage,
} from "./utils.ts";

const { sender, signer, receiver, lucid, emulator, scriptRef } =
  await setupTestEnv();
await printUtxos(lucid, sender.address);

const { channelId: channelId1 } = await testOpenOperation(
  {
    lucid,
    scriptRef,
    senderAddress: sender.address,
    receiverAddress: receiver.address,
    signerPubKey: signer.publicKey,
    groupId: "group1",
    expirationDate: BigInt(emulator.now() + 2 * 24 * 60 * 60 * 1000),
    initialDeposit: 100n,
    currentTime: BigInt(emulator.now()),
  },
  sender.privateKey,
);

const { channelId: channelId2 } = await testOpenOperation(
  {
    lucid,
    scriptRef,
    senderAddress: sender.address,
    receiverAddress: receiver.address,
    signerPubKey: signer.publicKey,
    groupId: "group1",
    expirationDate: BigInt(emulator.now() + 2 * 24 * 60 * 60 * 1000),
    initialDeposit: 20n,
    currentTime: BigInt(emulator.now()),
  },
  sender.privateKey,
);

const { payload: payload1ofcId1 } = await buildMessage(lucid, {
  channelId: channelId1,
  amount: 20n,
  senderAddress: sender.address,
});
const { payload: payload1ofcId2 } = await buildMessage(lucid, {
  channelId: channelId2,
  amount: 20n,
  senderAddress: sender.address,
});
lucid.selectWalletFromPrivateKey(signer.privateKey);
const privKey = getCMLPrivateKey(signer.seed);
const signature1 = await signMessage(privKey, payload1ofcId1);
const signature2 = await signMessage(privKey, payload1ofcId2);

await testClaimOperation(
  {
    lucid,
    listOfClaims: [
      {
        senderAddress: sender.address,
        channelId: channelId1,
        finalize: false,
        amount: 20n,
        signature: signature1,
      },
      {
        senderAddress: sender.address,
        channelId: channelId2,
        finalize: true,
        amount: 10n,
        signature: signature2,
      },
    ],
    scriptRef,
    currentTime: BigInt(emulator.now()),
    receiverAddress: receiver.address,
  },
  receiver.privateKey,
);

// Claim and close
const { payload: payload2ofcId1 } = await buildMessage(lucid, {
  channelId: channelId1,
  amount: 60n,
  senderAddress: sender.address,
});
lucid.selectWalletFromPrivateKey(signer.privateKey);

const signature3 = await signMessage(privKey, payload2ofcId1);
await testClaimOperation(
  {
    lucid,
    listOfClaims: [
      {
        senderAddress: sender.address,
        channelId: channelId1,
        finalize: true,
        amount: 60n,
        signature: signature3,
      },
    ],
    scriptRef,
    currentTime: BigInt(emulator.now()),
    receiverAddress: receiver.address,
  },
  receiver.privateKey,
);
