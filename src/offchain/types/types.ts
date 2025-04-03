import { Assets, OutRef } from "@spacebudz/lucid";
import { SingularityChannelMint, SingularityChannelSpend, TypesAction, TypesDatum } from "./plutus.ts";

// Aliases for types defined in plutus generated file
export const ChannelValidator = SingularityChannelSpend;
export type ChannelDatum = TypesDatum;
export type ChannelAction = TypesAction;
export const ChannelDatumSchema = ChannelValidator.datum;
export const ChannelRedeemerSchema = ChannelValidator.redeemer;
export const MintRedeemerSchema = SingularityChannelMint.redeemer;

export type ChannelInfo = OutRef &
  ChannelDatum & { balance: Assets; active: boolean; sender: string };