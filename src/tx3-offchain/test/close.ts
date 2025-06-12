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
  "e3f8c7dbc07f349bf1ebe763d5f2ea5fca464af113ce6203c0441d067977591e01";

const { closeCbor } = await closeChannel(provider, sender, channelId);

console.log("close channel cbor:", closeCbor);
