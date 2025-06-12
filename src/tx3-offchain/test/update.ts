import { NetworkId } from "@blaze-cardano/core";
import { U5C } from "@utxorpc/blaze-provider";
import { config } from "../../config.ts";
import { updateChannel } from "../builders/update.ts";

const provider = new U5C({
  url: "http://localhost:50051",
  network: NetworkId.Testnet,
});
const sender = config.sender;
const channelId =
  "90ec6e857d6f02b38cd902361963f68ea6cceab563e14dd29a2661b7b25912b501";

const { updateCbor } = await updateChannel(
  provider,
  sender,
  channelId,
  2,
  Date.now() + 1000 * 60 * 60 * 24 * 7, // Extend expiration by 7 days
  sender,
);

console.log("update channel cbor:", updateCbor);
