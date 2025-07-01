import { NetworkId } from "@blaze-cardano/core";
import { U5C } from "@utxorpc/blaze-provider";
import assert from "assert";
import { config } from "../../config.ts";
import { closeChannel } from "../builders/close.ts";

const args = process.argv.slice(2);
let channelId;

for (let i = 0; i < args.length; i++) {
  switch (args[i]) {
    case "-c":
    case "--channelId":
      channelId = args[i + 1];
      i++;
      break;
  }
}

assert(channelId !== undefined, "USAGE: npm run tx3-close -- -c <channelId>");

const provider = new U5C({
  url: "http://localhost:50051",
  network: NetworkId.Testnet,
});
const sender = config.sender;

const { closeCbor } = await closeChannel(provider, sender, channelId);

console.log("close channel cbor:", closeCbor);
