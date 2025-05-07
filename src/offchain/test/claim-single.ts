import { toHex } from "@spacebudz/lucid";
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
const { channelId } = await testOpenOperation(
  {
    lucid,
    scriptRef,
    senderAddress: sender.address,
    receiverAddress: receiver.address,
    signerPubKey: signer.publicKey,
    groupId: "group1",
    expirationDate: BigInt(emulator.now() + 2 * 24 * 60 * 60 * 1000),
    initialDeposit: 600n,
    currentTime: BigInt(emulator.now()),
  },
  sender.privateKey,
);

// Normal claim
const { payload } = await buildMessage(lucid, {
  channelId,
  amount: 20n,
  senderAddress: sender.address,
});
lucid.selectWalletFromPrivateKey(signer.privateKey);
const privKey = getCMLPrivateKey(signer.seed);
const signature = await signMessage(privKey, payload);
console.log(`let signature = #"${signature}"`);
console.log(`let payload = #"${payload}"`);
console.log(`let pubkey = #"${toHex(privKey.to_public().to_raw_bytes())}"`);

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

// Claim and close
const { payload: payload2 } = await buildMessage(lucid, {
  channelId,
  amount: 60n,
  senderAddress: sender.address,
});
lucid.selectWalletFromPrivateKey(signer.privateKey);
const signature2 = await signMessage(privKey, payload2);

await testClaimOperation(
  {
    lucid,
    listOfClaims: [
      {
        senderAddress: sender.address,
        channelId,
        finalize: true,
        amount: 60n,
        signature: signature2,
      },
    ],
    scriptRef,
    currentTime: BigInt(emulator.now()),
    receiverAddress: receiver.address,
  },
  receiver.privateKey,
);
