import { NetworkId } from "@blaze-cardano/core";
import { U5C } from "@utxorpc/blaze-provider";
import { config } from "../../config.ts";
import { closeChannel } from "../builders/close.ts";
const provider = new U5C({
  url: "http://localhost:50051",
  network: NetworkId.Testnet,
});
const sender = config.sender;
const channelId =
  "8be78554c9a8262d1b79961d974d18f94d3ba8de2140294d286c845ef244cf4b01";

const { closeCbor } = await closeChannel(provider, sender, channelId);

console.log("close channel cbor:", closeCbor);
