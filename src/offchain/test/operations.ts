import { Lucid, Utxo } from "@spacebudz/lucid";
import {
  CloseChannelParams,
  OpenChannelParams,
  UpdateChannelParams,
} from "../../shared/api-types.ts";
import { closeChannel } from "../builders/close-channel.ts";
import { openChannel } from "../builders/open-channel.ts";
import { updateChannel } from "../builders/update-channel.ts";
import { validatorDetails } from "../lib/utils.ts";
import { printUtxos, signAndSubmit } from "./utils.ts";

export const testOpenOperation = async (
  {
    lucid,
    scriptRef,
    senderAddress,
    receiverAddress,
    signerPubKey,
    groupId,
    expirationDate,
    initialDeposit,
  }: OpenChannelParams & { lucid: Lucid; scriptRef: Utxo },
  senderPrivKey: string,
  printLogs: boolean = true,
) => {
  const { openChannelCbor, channelId } = await openChannel(
    lucid,
    {
      senderAddress,
      signerPubKey,
      receiverAddress,
      initialDeposit,
      expirationDate,
      groupId,
    },
    scriptRef,
  );
  const openTx = await signAndSubmit(lucid, senderPrivKey, openChannelCbor);

  console.log(`\n
    > Channel opened with ID: ${channelId}
    > Initial Deposit: ${initialDeposit}
    > Expiration Date: ${new Date(Number(expirationDate))}
    > Tx ID: ${openTx}
    > CBOR: ${openChannelCbor}\n\n`);
  if (printLogs) {
    await printUtxos(lucid, senderAddress);
    const { scriptAddress } = validatorDetails(lucid);
    const utxosAtScript = await lucid.utxosAt(scriptAddress);
    printUtxos(lucid, undefined, utxosAtScript);
  }

  return channelId;
};

export const testCloseChannel = async (
  {
    lucid,
    scriptRef,
    senderAddress,
    channelId,
    currentTime,
  }: CloseChannelParams & {
    lucid: Lucid;
    scriptRef: Utxo;
    currentTime: bigint;
  },
  senderPrivKey: string,
  printLogs: boolean = true,
) => {
  const { closedChannelCbor } = await closeChannel(
    lucid,
    { senderAddress, channelId },
    scriptRef,
    currentTime,
  );
  const closedTx = await signAndSubmit(lucid, senderPrivKey, closedChannelCbor);

  console.log(`\n
        > Channel closed with ID: ${channelId}
        > Tx ID: ${closedTx}
        > CBOR: ${closedChannelCbor}\n\n`);

  if (printLogs) {
    await printUtxos(lucid, senderAddress);
    const { scriptAddress } = validatorDetails(lucid);
    const utxosAtScript = await lucid.utxosAt(scriptAddress);
    printUtxos(lucid, undefined, utxosAtScript);
  }
};

export const testUpdateOperation = async (
  {
    lucid,
    scriptRef,
    userAddress,
    senderAddress,
    channelId,
    addDeposit,
    expirationDate,
    currentTime,
  }: UpdateChannelParams & {
    lucid: Lucid;
    scriptRef: Utxo;
    currentTime: bigint;
  },
  userPrivKey: string,
  printLogs: boolean = true,
) => {
  const { updatedChannelCbor } = await updateChannel(
    lucid,
    {
      userAddress,
      senderAddress,
      channelId,
      addDeposit,
      expirationDate,
    },
    scriptRef,
    currentTime,
  );
  const updatedTx = await signAndSubmit(lucid, userPrivKey, updatedChannelCbor);

  console.log(`\n
      > Channel updated with ID: ${channelId}
      > Add Deposit: ${addDeposit}
      > New Expiration Date: ${new Date(Number(expirationDate))}
      > Tx ID: ${updatedTx}
      > CBOR: ${updatedChannelCbor}\n\n`);

  if (printLogs) {
    await printUtxos(lucid, senderAddress);
    const { scriptAddress } = validatorDetails(lucid);
    const utxosAtScript = await lucid.utxosAt(scriptAddress);
    printUtxos(lucid, undefined, utxosAtScript);
  }
};
