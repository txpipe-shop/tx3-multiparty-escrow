import { NetworkId } from "@blaze-cardano/core";
import { U5C } from "@utxorpc/blaze-provider";
import { config } from "../../config.ts";
import { claimChannelAndContinue } from "../builders/claimAndContinue.ts";

const provider = new U5C({
  url: "http://localhost:50051",
  network: NetworkId.Testnet,
});
const sender = config.sender;
const channelId =
  "1097dc794871b6c1cca5ccca5d2d987dbd2b9e698d0294b29cdb1ce0d056a87301";
const amount = 3;
const payload =
  "f94e85cf0f67becf4ecea16227e13f8775a91b2c32cb9050520e9e6e12c678921f9b2a66a365a8260346cbcf891c0f4b404c93004fce1c5df2c2107b5981e208";
const receiver = config.receiver;

const { claimCbor } = await claimChannelAndContinue(
  provider,
  sender,
  channelId,
  amount,
  payload,
  receiver,
);

console.log("claim channel cbor:", claimCbor);
