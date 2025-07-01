import {
  Address,
  addressFromValidator,
  RewardAccount,
} from "@blaze-cardano/core";
import { U5C } from "@utxorpc/blaze-provider";
import { config } from "../../config.ts";
import { SingularityChannelWithdraw } from "../blueprint.ts";
import { protocol } from "../gen/typescript/protocol.ts";
import {
  bech32ToPubKeyHash,
  getChannelUtxo,
  getCollateralUtxo,
  toPreviewBlockSlot,
  UtxoToRef,
} from "../utils/index.ts";

export const claimChannelAndContinue = async (
  provider: U5C,
  sender: string,
  channelId: string,
  amount: number,
  signature: string,
  receiver: string,
) => {
  const script = new SingularityChannelWithdraw().Script;
  const scriptHash = script.hash();
  const scriptAddress = addressFromValidator(
    provider.network,
    script,
  ).toBytes();
  const credential = Address.fromBytes(scriptAddress).getProps().paymentPart;
  if (!credential)
    throw new Error("Script address does not have a payment credential");

  const scriptRewardAddress = RewardAccount.fromCredential(
    credential,
    provider.network,
  );

  const channelUtxo = await getChannelUtxo(provider, sender, channelId);

  const utxos = await provider.getUnspentOutputs(Address.fromBech32(receiver));
  const collateralUtxo = await getCollateralUtxo(utxos);
  const { tx } = await protocol.claimAndContinueTx({
    amountinput: amount,
    channelutxo: UtxoToRef(channelUtxo),
    script: scriptAddress,
    receiver: Address.fromBech32(receiver).toBytes(),
    signatureinput: Buffer.from(signature, "hex"),
    policyid: Buffer.from(scriptHash, "hex"),
    tokenname: Buffer.from(bech32ToPubKeyHash(sender), "hex"),
    stakingaddress: Address.fromBech32(scriptRewardAddress).toBytes(),
    since: toPreviewBlockSlot(Date.now() - 1000 * 60 * 3),
    until: toPreviewBlockSlot(Date.now() + 1000 * 60 * 60 * 1),
    collateralref: UtxoToRef(collateralUtxo),
    validatorref: config.ref_script.txHash + "#0",
  });

  return { claimCbor: tx };
};
