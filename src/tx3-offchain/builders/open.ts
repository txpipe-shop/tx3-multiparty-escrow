import { Address, addressFromValidator } from "@blaze-cardano/core";
import { U5C } from "@utxorpc/blaze-provider";
import { config } from "../../config.ts";
import { SingularityChannelMint } from "../blueprint.ts";
import { protocol } from "../gen/typescript/protocol.ts";
import {
  bech32ToPubKeyHash,
  getCollateralUtxo,
  getSuitableUtxos,
  toPreviewBlockSlot,
  UtxoToRef,
} from "../utils/index.ts";

export const openChannel = async (
  provider: U5C,
  sender: string,
  receiver: string,
  signerPubKey: string,
  initialDeposit: number,
  groupId: string,
  expirationDate: number,
) => {
  const utxos = await provider.getUnspentOutputs(Address.fromBech32(sender));
  const finalUtxos = getSuitableUtxos(utxos, initialDeposit);
  if (finalUtxos.length === 0)
    throw new Error("No suitable UTXO found for opening a channel");

  const utxo = finalUtxos[0];
  let hex_index = utxo.toCore()[0].index.toString(16);
  if (hex_index.length % 2 !== 0) hex_index = "0" + hex_index;

  const channelId = Buffer.from(utxo.toCore()[0].txId + hex_index, "hex");
  const mintingPolicy = new SingularityChannelMint().Script.hash();

  const collateralUtxo = await getCollateralUtxo(utxos);

  const { tx } = await protocol.openTx({
    sender: Address.fromBech32(sender).toBytes(),
    script: addressFromValidator(
      provider.network,
      new SingularityChannelMint().Script,
    ).toBytes(),
    receiverinput: Buffer.from(bech32ToPubKeyHash(receiver), "hex"),
    signerpubkey: Buffer.from(signerPubKey, "hex"),
    initialdeposit: initialDeposit,
    channelid: channelId,
    groupid: Buffer.from(groupId),
    date: expirationDate,
    inputref: UtxoToRef(utxo),
    policyid: Buffer.from(mintingPolicy, "hex"),
    tokenname: Buffer.from(bech32ToPubKeyHash(sender), "hex"),
    since: toPreviewBlockSlot(Date.now() - 1000 * 60 * 5),
    until: toPreviewBlockSlot(Date.now() + 1000 * 60 * 5),
    collateralref: UtxoToRef(collateralUtxo),
    validatorref: config.ref_script.txHash + "#0",
  });

  return { openCbor: tx, channelId: channelId.toString("hex") };
};
