import { Lucid, toText, Utxo } from "@spacebudz/lucid";

const parseAssets = (walletUtxo: Utxo) => {
  return Object.fromEntries(
    Object.entries(walletUtxo.assets).map(([key, value]) => {
      const newKey = key.slice(0, 56) + " " + toText(key.slice(56));
      return [newKey, typeof value === "bigint" ? value.toString() : value];
    })
  );
};
const maxLength = 70;
const parseUtxos = (utxos: Utxo[]) =>
  JSON.stringify(
    utxos.map((utxo) => ({
      ...utxo,
      assets: parseAssets(utxo),
    })),
    (_, value) => {
      if (typeof value === "bigint") return value.toString();
      else if (typeof value === "string" && value.length > maxLength)
        return value.slice(0, maxLength) + "...";
      return value;
    },
    4
  );

export const printUtxos = async (
  lucid: Lucid,
  address?: string,
  utxos?: Utxo[]
) => {
  address && lucid.selectReadOnlyWallet({ address });
  const walletUtxos = utxos ?? (await lucid.wallet.getUtxos());
  const title = address ? "WALLET UTXOS" : "SCRIPT UTXOS";
  console.log(`-------------------------${title}------------------------------
${parseUtxos(walletUtxos)}
------------------------------------------------------------------`);
};
