import { NetworkId } from "@blaze-cardano/core";
import { U5C } from "@utxorpc/blaze-provider";
import assert from "assert";
import { config } from "../../config.ts";
import { claimChannel } from "../builders/claim.ts";

const args = process.argv.slice(2);
let payload,
  channelId,
  amount,
  finalize = false;
let sender = config.sender;
let receiver = config.receiver;

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
    case "-f":
    case "--finalize":
      finalize = args[i + 1] === "true";
      i++;
      break;
    case "-s":
    case "--sender":
      sender = args[i + 1];
      i++;
      break;
    case "-r":
    case "--receiver":
      receiver = args[i + 1];
      i++;
      break;
  }
}

assert(
  channelId !== undefined &&
    payload !== undefined &&
    amount !== undefined &&
    sender !== undefined &&
    receiver !== undefined,
  "USAGE: npm run tx3-claim -- -c <channelId> -p <payload> -a <amount> -f <finalize> [-s <sender>] [-r <receiver>]",
);

const provider = new U5C({
  url: "http://localhost:50051",
  network: NetworkId.Testnet,
});

const { claimCbor } = await claimChannel(
  provider,
  sender,
  channelId,
  amount,
  payload,
  receiver,
  finalize,
);

console.log("claim channel cbor:", claimCbor);
