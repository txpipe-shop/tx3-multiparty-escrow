import { NetworkId } from "@blaze-cardano/core";
import { U5C } from "@utxorpc/blaze-provider";
import { config } from "../../config.ts";
import { claimChannel } from "../builders/claim.ts";

const provider = new U5C({
  url: "http://localhost:50051",
  network: NetworkId.Testnet,
});
const sender = config.sender;
const channelId =
  "587ce494444201c310c4fe204c6f7de687d12184177ebd1adce34621cfa39b7f01";
const amount = 3;
const payload =
  "86620f8f1e6981a71eaa5608644675c77abd891511f6b9054a6fc4ef6546a3f34c451c51179dc6bdb5b06d3f2efb48c7e49b84c6b3316344ac29d0becd9cfb00";
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
