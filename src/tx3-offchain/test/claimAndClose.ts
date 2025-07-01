import { NetworkId } from "@blaze-cardano/core";
import { U5C } from "@utxorpc/blaze-provider";
import assert from "assert";
import { config } from "../../config.ts";
import { claimChannel } from "../builders/claimAndClose.ts";

const args = process.argv.slice(2);
let payload, channelId, amount;

for (let i = 0; i < args.length; i++) {
  switch (args[i]) {
    case "-c":
    case "--channelId":
      channelId = args[i + 1];
      i++;
      break;
    case "-p":
    case "--payload":
      payload = args[i + 1];
      i++;
      break;
    case "-a":
    case "--amount":
      amount = Number(args[i + 1]);
      i++;
      break;
  }
}

assert(
  channelId !== undefined && payload !== undefined && amount !== undefined,
  "USAGE: npm run tx3-claim-and-close -- -c <channelId> -p <payload> -a <amount>",
);
const provider = new U5C({
  url: "http://localhost:50051",
  network: NetworkId.Testnet,
});
const sender = config.sender;
const receiver = config.receiver;

const { claimCbor } = await claimChannel(
  provider,
  sender,
  channelId,
  amount,
  payload,
  receiver,
);

console.log("claim channel cbor:", claimCbor);
