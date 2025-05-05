import { getAllChannels } from "../queries/all-channels.ts";
import { getChannelById } from "../queries/channel-by-id.ts";
import { getChannelsFromReceiver } from "../queries/channels-from-receiver.ts";
import { getChannelsFromSender } from "../queries/channels-from-sender.ts";
import { testOpenOperation } from "./operations.ts";
import { printChannels, printUtxos, setupTestEnv } from "./utils.ts";

const { sender, signer, receiver, lucid, emulator, scriptRef } =
  await setupTestEnv();
await printUtxos(lucid, sender.address);

printChannels("GET ALL CHANNELS BEFORE TX", await getAllChannels(lucid));

const { channelId } = await testOpenOperation(
  {
    lucid,
    scriptRef,
    senderAddress: sender.address,
    receiverAddress: receiver.address,
    signerPubKey: signer.publicKey,
    groupId: "group1",
    expirationDate: BigInt(emulator.now() + 50 * 1000),
    initialDeposit: 6n,
    currentTime: BigInt(emulator.now()),
  },
  sender.privateKey,
);

printChannels(
  "GET SENDERS CHANNELS AFTER TX",
  await getChannelsFromSender(lucid, sender.address),
);
printChannels("GET CHANNEL BY ID", await getChannelById(lucid, channelId));
printChannels(
  "GET CHANNELS FROM RECEIVER",
  await getChannelsFromReceiver(lucid, receiver.address),
);
