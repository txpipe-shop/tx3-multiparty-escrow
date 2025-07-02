import { NetworkId } from "@blaze-cardano/core";
import { U5C } from "@utxorpc/blaze-provider";
import assert from "assert";
import { config } from "../../config.ts";
import { updateChannel } from "../builders/update.ts";

const args = process.argv.slice(2);
let channelId, amount, expirationDate;
let sender = config.sender;

for (let i = 0; i < args.length; i++) {
  switch (args[i]) {
    case "-c":
    case "--channelId":
      channelId = args[i + 1];
      i++;
      break;
    case "-a":
    case "--amount":
      amount = Number(args[i + 1]);
      i++;
      break;
    case "-e":
    case "--expirationDate":
      expirationDate = Number(args[i + 1]);
      i++;
      break;
    case "-d":
    case "--default":
      amount = 1; // Default amount of 1 AGIX
      expirationDate = Date.now() + 7 * 24 * 60 * 60 * 1000; // one week from now
      i++;
      break;
    case "-s":
    case "--sender":
      sender = args[i + 1];
      i++;
      break;
  }
}

assert(
  channelId !== undefined &&
    expirationDate !== undefined &&
    amount !== undefined &&
    sender !== undefined,
  "USAGE: npm run tx3-update -- -c <channelId> [-a <amount>] [-e <expirationDate>] [-d] [-s <sender>]",
);

const provider = new U5C({
  url: "http://localhost:50051",
  network: NetworkId.Testnet,
});

const { updateCbor } = await updateChannel(
  provider,
  sender,
  channelId,
  amount,
  expirationDate,
  sender,
);

console.log("update channel cbor:", updateCbor);
