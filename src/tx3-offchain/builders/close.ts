import { Address } from "@blaze-cardano/core";
import { U5C } from "@utxorpc/blaze-provider";
import { config } from "../../config.ts";
import { SingularityChannelMint } from "../blueprint.ts";
import { protocol } from "../gen/typescript/protocol.ts";
import {
  bech32ToPubKeyHash,
  getChannelUtxo,
  getCollateralUtxo,
  toPreviewBlockSlot,
  UtxoToRef,
} from "../utils/index.ts";

export const closeChannel = async (
  provider: U5C,
  sender: string,
  channelId: string,
) => {
  const scriptHash = new SingularityChannelMint().Script.hash();

  const channelUtxo = await getChannelUtxo(provider, sender, channelId);

  const utxos = await provider.getUnspentOutputs(Address.fromBech32(sender));

  const collateralUtxo = await getCollateralUtxo(utxos);

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
