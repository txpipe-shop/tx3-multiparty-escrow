import { Address, HexBlob, PlutusData } from "@blaze-cardano/core";
import { parse } from "@blaze-cardano/data";
import { U5C } from "@utxorpc/blaze-provider";
import { config } from "../../config.ts";
import { Datum, SingularityChannelMint } from "../blueprint.ts";
import { protocol } from "../gen/typescript/protocol.ts";
import { bech32ToPubKeyHash } from "../utils/string.ts";
import { toPreviewBlockSlot } from "../utils/time.ts";
import { getChannelUtxo, getSuitableUtxos } from "../utils/utxos.ts";
import { UtxoToRef } from "./../utils/string.ts";
import { getCollateralUtxo } from "./../utils/utxos.ts";

export const updateChannel = async (
  provider: U5C,
  sender: string,
  channelId: string,
  addDeposit: number | undefined,
  extendExpiration: number | undefined,
  user: string,
) => {
  if (!addDeposit && !extendExpiration)
    throw new Error(
      "Nothing to update, provide addDeposit or extendExpiration",
    );

  const scriptHash = new SingularityChannelMint().Script.hash();
  const scriptUtxos = await provider.getUnspentOutputs(
    Address.fromBytes(HexBlob.fromBytes(Buffer.from("70" + scriptHash, "hex"))),
  );
  const [channelUtxo] = getChannelUtxo(scriptUtxos, sender, channelId);
  if (!channelUtxo)
    throw new Error(
      `Channel UTXO with id ${channelId} not found for sender ${sender}`,
    );

  const datumExpirationDate = Number(
    parse(Datum, PlutusData.fromCore(channelUtxo.toCore()[1].datum!))
      .expiration_date,
  );
  if (extendExpiration! < datumExpirationDate)
    throw new Error("New expiration date must be greater than current");

  const signer = extendExpiration != datumExpirationDate ? sender : user;

  const utxos = await provider.getUnspentOutputs(Address.fromBech32(user));
  const updateUtxo = getSuitableUtxos(utxos, addDeposit!);
  if (updateUtxo.length === 0)
    throw new Error("No sufficient amount of AGIX for update");

  const collateralUtxo = getCollateralUtxo(utxos);

  const utxo = updateUtxo[0];
  let hex_index = utxo.toCore()[0].index.toString(16);
  if (hex_index.length % 2 !== 0) hex_index = "0" + hex_index;

  const { tx } = await protocol.updateTx({
    channelutxo: UtxoToRef(channelUtxo),
    signer: Buffer.from(bech32ToPubKeyHash(signer), "hex"),
    adddeposit: addDeposit ?? 0,
    extenddate: extendExpiration ?? datumExpirationDate,
    inputref: UtxoToRef(utxo),
    user: Address.fromBech32(user).toBytes(),
    since: toPreviewBlockSlot(Date.now() - 1000 * 60),
    until: toPreviewBlockSlot(Date.now() + 1000 * 60),
    collateralref: UtxoToRef(collateralUtxo),
    validatorref: config.ref_script.txHash + "#0",
  });

  return { updateCbor: tx };
};
