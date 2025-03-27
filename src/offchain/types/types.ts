import { Assets } from "@spacebudz/lucid";
import { TypesDatum } from "./plutus.ts";

export type ChannelInfo = TypesDatum & { balance: Assets; active: boolean; sender: string };
