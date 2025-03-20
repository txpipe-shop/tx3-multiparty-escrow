import e from "express";
import { JSONBig } from "./server.ts";
import { Lucid } from "@spacebudz/lucid";

const setRoutes = (lucid: Lucid, expressApp: e.Application) => {
  expressApp.post("route", async (req, res) => {
    // logic
  });
};

export { setRoutes };
