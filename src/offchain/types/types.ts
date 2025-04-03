import { Assets, OutRef } from "@spacebudz/lucid";
import { TypesDatum } from "./plutus.ts";

export type ChannelInfo = OutRef &
  TypesDatum & { balance: Assets; active: boolean; sender: string };
