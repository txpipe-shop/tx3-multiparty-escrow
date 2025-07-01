import { Address, TransactionUnspentOutput } from "@blaze-cardano/core";

export const bech32ToPubKeyHash = (bech32: string): string => {
  return String(
    Address.fromBech32(bech32).asBase()?.getPaymentCredential().hash,
  );
};

export const UtxoToRef = (utxo: TransactionUnspentOutput): string => {
  return `${utxo.toCore()[0].txId}#${utxo.toCore()[0].index}`;
};
