import { NetworkId } from "@blaze-cardano/core";
import { U5C } from "@utxorpc/blaze-provider";
import assert from "assert";
import { config } from "../../config.ts";
import { openChannel } from "../builders/open.ts";

const args = process.argv.slice(2);
let initialDeposit, groupId;
let sender = config.sender;
let receiver = config.receiver;
let signerPubKey = config.signer_pub_key;
let expirationDate = Date.now() + 1000 * 60 * 60 * 24; // 1 day from now

for (let i = 0; i < args.length; i++) {
  switch (args[i]) {
    case "-a":
    case "--amount":
      initialDeposit = Number(args[i + 1]);
      i++;
      break;
    case "-g":
    case "--groupId":
      groupId = args[i + 1];
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
    case "-spk":
    case "--signerPubKey":
      signerPubKey = args[i + 1];
      i++;
      break;
    case "-e":
    case "--expirationDate":
      expirationDate = Number(args[i + 1]);
      i++;
      break;
  }
}

assert(
  initialDeposit !== undefined &&
    groupId !== undefined &&
    sender !== undefined &&
    receiver !== undefined &&
    signerPubKey !== undefined &&
    expirationDate !== undefined,
  "USAGE: npm run tx3-open -- -a <initialDeposit> -g <groupId> [-s <sender>] [-r <receiver>] [-spk <signerPubKey>] [-e <expirationDate>]",
);

const provider = new U5C({
  url: "http://localhost:50051",
  network: NetworkId.Testnet,
});

const { openCbor, channelId } = await openChannel(
  provider,
  sender,
  receiver,
  signerPubKey,
  initialDeposit,
  groupId,
  expirationDate,
);

console.log("Open channel cbor:", openCbor, "\nWith channelId:", channelId);
