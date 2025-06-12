import { Address, AssetId, HexBlob, PlutusData } from "@blaze-cardano/core";
import { parse } from "@blaze-cardano/data";
import { U5C } from "@utxorpc/blaze-provider";
import { config } from "../../config.ts";
import { Datum, SingularityChannelMint } from "../blueprint.ts";
import { protocol } from "../gen/typescript/protocol.ts";
import { bech32ToPubKeyHash } from "../utils/string.ts";
import { toPreviewBlockSlot } from "../utils/time.ts";

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

  const senderPubKeyHash = bech32ToPubKeyHash(sender);
  const scriptHash = new SingularityChannelMint().Script.hash();
  const channelToken = scriptHash + senderPubKeyHash;
  const scriptUtxos = await provider.getUnspentOutputs(
    Address.fromBytes(HexBlob.fromBytes(Buffer.from("70" + scriptHash, "hex"))),
  );

  const [channelUtxo] = scriptUtxos
    .filter((u) => {
      const value = u.output().toCore().value;
      return value.assets?.get(AssetId(channelToken));
    })
    .filter((u) => {
      try {
        const parsedDatum = parse(
          Datum,
          PlutusData.fromCore(u.output().toCore().datum!),
        );
        return parsedDatum.channel_id === channelId;
      } catch (e) {
        console.warn(e);
        return false;
      }
    });

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

  const channelUtxoId =
    channelUtxo.toCore()[0].txId + "#" + channelUtxo.toCore()[0].index;

  const utxos = await provider.getUnspentOutputs(Address.fromBech32(user));
  const updateUtxo = utxos.filter((u) => {
    const value = u.toCore()[1].value;
    return (
      value.coins &&
      value.coins >= 20_000_000n &&
      (value.assets?.get(AssetId(config.token)) ?? 0) >= addDeposit!
    );
  });
  if (updateUtxo.length === 0)
    throw new Error("No sufficient amount of AGIX for update");

  const [collateralUtxo] = utxos.filter((u) => {
    const value = u.toCore()[1].value;
    return value.coins && value.coins <= 5_000_000n;
  });

  const utxo = updateUtxo[0];
  let hex_index = utxo.toCore()[0].index.toString(16);
  if (hex_index.length % 2 !== 0) hex_index = "0" + hex_index;

  const { tx } = await protocol.updateTx({
    channelutxo: channelUtxoId,
    signer: Buffer.from(bech32ToPubKeyHash(signer), "hex"),
    adddeposit: addDeposit ?? 0,
    extenddate: extendExpiration ?? datumExpirationDate,
    inputref: utxo.toCore()[0].txId + "#" + utxo.toCore()[0].index,
    user: Address.fromBech32(user).toBytes(),
    since: toPreviewBlockSlot(Date.now() - 1000 * 60),
    until: toPreviewBlockSlot(Date.now() + 1000 * 60),
    collateralref:
      collateralUtxo.toCore()[0].txId + "#" + collateralUtxo.toCore()[0].index,
    validatorref: config.ref_script.txHash + "#0",
  });

  return { updateCbor: tx };
};
