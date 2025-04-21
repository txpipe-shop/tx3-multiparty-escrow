import { Blockfrost, Crypto, Lucid } from "@spacebudz/lucid";
import promptSync from "prompt-sync";
import { env } from "../../config.ts";
import { ClaimChannelParams } from "../../shared/api-types.ts";
import { buildMessage } from "../builders/build-message.ts";
import { getChannelById } from "../queries/channel-by-id.ts";
import { getChannelsFromSender } from "../queries/channels-from-sender.ts";
import {
  testClaimOperation,
  testCloseChannel,
  testOpenOperation,
  testUpdateOperation,
} from "./operations.ts";
import { getScriptRef, printChannels } from "./utils.ts";

const prompt = promptSync();

const lucid = new Lucid({
  provider: new Blockfrost(
    "https://cardano-preview.blockfrost.io/api/v0",
    env.PROVIDER_PROJECT_ID,
  ),
});

const seed = env.SEED;
if (!seed) throw Error("Unable to read wallet's seed from env");
lucid.selectWalletFromSeed(seed);
const { privateKey, publicKey } = Crypto.seedToDetails(seed, 0, "Payment");
const address = await lucid.wallet.address();

type ActionKey = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
const scriptRef = await getScriptRef(lucid, privateKey);

const actions: Record<ActionKey, () => Promise<void>> = {
  1: async () => {
    console.log("\n[Creating a channel]");
    const receiverAddress = prompt("Receiver address: ");
    const initialDeposit = prompt("Initial deposit: ");
    const expirationDate = prompt("Expiration date (in ms): ");
    const groupId = prompt("Group id: ");
    console.log("Creating a channel...");
    await testOpenOperation(
      {
        lucid,
        scriptRef,
        senderAddress: address,
        receiverAddress,
        signerPubKey: publicKey,
        groupId: BigInt(groupId),
        expirationDate: BigInt(expirationDate),
        initialDeposit: BigInt(initialDeposit),
      },
      privateKey,
      false,
    );
  },
  2: async () => {
    console.log("\n[Updating a channel]");
    const channelId = prompt("Channel ID: ");
    const addDeposit = prompt("New deposit: ");
    const expirationDate = prompt("New expiration date (in ms): ");
    console.log("Updating a channel...");
    await testUpdateOperation(
      {
        lucid,
        scriptRef,
        userAddress: address,
        senderAddress: address,
        channelId,
        addDeposit: BigInt(addDeposit),
        expirationDate: BigInt(expirationDate),
        currentTime: BigInt(Date.now()),
      },
      privateKey,
      false,
    );
  },
  3: async () => {
    console.log("\n[Building a message]");
    const channelId = prompt("Channel ID: ");
    const amount = prompt("Amount: ");
    const { payload } = await buildMessage(lucid, {
      channelId,
      amount: BigInt(amount),
      senderAddress: address,
    });
    lucid.selectWalletFromPrivateKey(privateKey);
    const message = await lucid.wallet.signMessage(address, payload);

    console.log("Signed Message:");
    console.log(message);
  },
  4: async () => {
    console.log("\n[Closing a channel]");
    const channelId = prompt("Channel ID: ");
    console.log("Closing a channel...");
    await testCloseChannel(
      {
        lucid,
        scriptRef,
        senderAddress: address,
        channelId,
        currentTime: BigInt(Date.now()),
      },
      privateKey,
      false,
    );
  },
  5: async () => {
    console.log("\n[Claiming channels]");
    let claimAction = 0;
    let listOfClaims: ClaimChannelParams = [];
    while (claimAction !== 2) {
      console.log(
        "\nOPTIONS:\n1: Add a channel to claim\n2: Claim Added channels",
      );
      claimAction = Number(prompt("Select an option (1-2): "));
      if (claimAction === 1) {
        const senderAddress = prompt("Sender Address: ");
        const channelId = prompt("Channel ID: ");
        const finalize = prompt("Finalize (y/n): ");
        const amount = prompt("Amount: ");
        const signature = prompt("Signature: ");
        listOfClaims.push({
          senderAddress,
          channelId,
          finalize: finalize === "y",
          amount: BigInt(amount),
          signature,
        });
      } else if (claimAction !== 2) {
        console.log("Invalid option. Please try again.");
      }
    }
    console.log("Closing a channel...");
    await testClaimOperation(
      {
        lucid,
        listOfClaims,
        scriptRef,
        currentTime: BigInt(Date.now()),
        receiverAddress: address,
      },
      privateKey,
      false,
    );
  },
  6: async () => {
    console.log("\n[Get a channel by ID]");
    const channelId = prompt("Channel ID: ");
    printChannels(
      `CHANNELS WITH ID: ${channelId}`,
      await getChannelById(lucid, channelId),
    );
  },
  7: async () => {
    console.log("\n[Get Own Channels]");
    printChannels("OWN CHANNELS", await getChannelsFromSender(lucid, address));
  },
  8: async () => {
    console.log("\n[EXIT]");
  },
};

async function main() {
  let action = 0;
  while (action !== 8) {
    console.log(
      "\nOPTIONS:\n1: create a channel\n2: update a channel\n3: build a message\n4: close channel\n5: claim a channel\n6: get channel by ID\n7: get own channels\n8: exit",
    );
    action = Number(prompt("Select an option (1-8): "));
    if (action && actions.hasOwnProperty(action))
      try {
        await actions[action as ActionKey]();
      } catch (e) {
        console.error(e);
      }
    else console.log("Invalid option. Please try again.");
  }
}

main();
