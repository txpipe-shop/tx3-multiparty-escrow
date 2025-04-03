import { Data } from "@spacebudz/lucid";
import {
  ChannelAction,
  ChannelDatum,
  ChannelDatumSchema,
  ChannelRedeemerSchema,
} from "../types/types.ts";

export const toChannelDatum = (d: ChannelDatum) =>
  Data.to(d, ChannelDatumSchema);
export const fromChannelDatum = (d: string) => Data.from(d, ChannelDatumSchema);

export const toChannelRedeemer = (r: ChannelAction) =>
  Data.to(r, ChannelRedeemerSchema);
export const fromChannelRedeemer = (r: string) =>
  Data.from(r, ChannelRedeemerSchema);
