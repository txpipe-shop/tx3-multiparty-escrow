import { Emulator, Lucid } from "@spacebudz/lucid";
import { config } from "../../config.ts";
import { buildMessage } from "../builders/build-message.ts";
import { testClaimOperation, testOpenOperation } from "./operations.ts";
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
  seed: senderSeed,
  address: senderAddress,
} = getRandomUser();

const { address: receiverAddress } = getRandomUser();

const emulator = new Emulator([
  {
    address: senderAddress,
    assets: { lovelace: 30_000_000n, [config.token]: 120000n },
  },
]);
const lucid = new Lucid({ provider: emulator });
await printUtxos(lucid, senderAddress);

const scriptRef = await getScriptRef(lucid, senderPrivKey);

const channelId1 = await testOpenOperation(
  {
    lucid,
    scriptRef,
    senderAddress,
    receiverAddress,
    signerPubKey: senderPubKey,
    groupId: 10n,
    expirationDate: BigInt(Date.now() + 2 * 24 * 60 * 60 * 1000),
    initialDeposit: 100n,
  },
  senderPrivKey,
);

const channelId2 = await testOpenOperation(
  {
    lucid,
    scriptRef,
    senderAddress,
    receiverAddress,
    signerPubKey: senderPubKey,
    groupId: 9n,
    expirationDate: BigInt(Date.now() + 2 * 24 * 60 * 60 * 1000),
    initialDeposit: 20n,
  },
  senderPrivKey,
);

const { payload: payload1ofcId1 } = await buildMessage(lucid, {
  channelId: channelId1,
  amount: 20n,
  senderAddress,
});
const { payload: payload1ofcId2 } = await buildMessage(lucid, {
  channelId: channelId2,
  amount: 20n,
  senderAddress,
});
lucid.selectWalletFromPrivateKey(senderPrivKey);
const privKey = getCMLPrivateKey(senderSeed);
const signature1 = await signMessage(privKey, payload1ofcId1);
const signature2 = await signMessage(privKey, payload1ofcId2);

await testClaimOperation(
  {
    lucid,
    listOfClaims: [
      {
        senderAddress,
        channelId: channelId1,
        finalize: false,
        amount: 20n,
        signature: signature1,
      },
      {
        senderAddress,
        channelId: channelId2,
        finalize: true,
        amount: 10n,
        signature: signature2,
      },
    ],
    scriptRef,
    currentTime: BigInt(Date.now()),
    receiverAddress,
  },
  senderPrivKey,
);

// Claim and close
const { payload: payload2ofcId1 } = await buildMessage(lucid, {
  channelId: channelId1,
  amount: 60n,
  senderAddress,
});
lucid.selectWalletFromPrivateKey(senderPrivKey);

const signature3 = await signMessage(privKey, payload2ofcId1);
await testClaimOperation(
  {
    lucid,
    listOfClaims: [
      {
        senderAddress,
        channelId: channelId1,
        finalize: true,
        amount: 60n,
        signature: signature3,
      },
    ],
    scriptRef,
    currentTime: BigInt(Date.now()),
    receiverAddress,
  },
  senderPrivKey,
);
