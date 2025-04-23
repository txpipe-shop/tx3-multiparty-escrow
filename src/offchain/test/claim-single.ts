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

const { channelId } = await testOpenOperation(
  {
    lucid,
    scriptRef,
    senderAddress,
    receiverAddress,
    signerPubKey: senderPubKey,
    groupId: 10n,
    expirationDate: BigInt(Date.now() + 2 * 24 * 60 * 60 * 1000),
    initialDeposit: 600n,
  },
  senderPrivKey,
);

// Normal claim
const { payload } = await buildMessage(lucid, {
  channelId,
  amount: 20n,
  senderAddress,
});
lucid.selectWalletFromPrivateKey(senderPrivKey);
const privKey = getCMLPrivateKey(senderSeed);
const signature = await signMessage(privKey, payload);

await testClaimOperation(
  {
    lucid,
    listOfClaims: [
      {
        senderAddress,
        channelId,
        finalize: false,
        amount: 20n,
        signature,
      },
    ],
    scriptRef,
    currentTime: BigInt(Date.now()),
    receiverAddress,
  },
  senderPrivKey,
);

// Claim and close
const { payload: payload2 } = await buildMessage(lucid, {
  channelId,
  amount: 60n,
  senderAddress,
});
lucid.selectWalletFromPrivateKey(senderPrivKey);
const signature2 = await signMessage(privKey, payload2);

await testClaimOperation(
  {
    lucid,
    listOfClaims: [
      {
        senderAddress,
        channelId,
        finalize: true,
        amount: 60n,
        signature: signature2,
      },
    ],
    scriptRef,
    currentTime: BigInt(Date.now()),
    receiverAddress,
  },
  senderPrivKey,
);
