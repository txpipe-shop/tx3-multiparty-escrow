import { Address, HexBlob } from "@blaze-cardano/core";
import { U5C } from "@utxorpc/blaze-provider";
import { config } from "../../config.ts";
import { SingularityChannelMint } from "../blueprint.ts";
import { protocol } from "../gen/typescript/protocol.ts";
import { bech32ToPubKeyHash, UtxoToRef } from "../utils/string.ts";
import { toPreviewBlockSlot } from "../utils/time.ts";
import { getChannelUtxo } from "../utils/utxos.ts";
import { getCollateralUtxo } from "./../utils/utxos.ts";

export const closeChannel = async (
  provider: U5C,
  sender: string,
  channelId: string,
) => {
  const scriptHash = new SingularityChannelMint().Script.hash();
  const scriptUtxos = await provider.getUnspentOutputs(
    Address.fromBytes(HexBlob.fromBytes(Buffer.from("70" + scriptHash, "hex"))),
  );

  const [channelUtxo] = getChannelUtxo(scriptUtxos, sender, channelId);

  const utxos = await provider.getUnspentOutputs(Address.fromBech32(sender));
  const collateralUtxo = getCollateralUtxo(utxos);

  const { tx } = await protocol.closeTx({
    channelutxo: UtxoToRef(channelUtxo),
    sender: Address.fromBech32(sender).toBytes(),
    policyid: Buffer.from(scriptHash, "hex"),
    tokenname: Buffer.from(bech32ToPubKeyHash(sender), "hex"),
    since: toPreviewBlockSlot(Date.now() - 1000 * 60),
    until: toPreviewBlockSlot(Date.now() + 1000 * 60),
    collateralref: UtxoToRef(collateralUtxo),
    validatorref: config.ref_script.txHash + "#0",
  });

  return { closeCbor: tx };
};
