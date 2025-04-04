import { Lucid } from "@spacebudz/lucid";
import e from "express";

const setRoutes = (_lucid: Lucid, expressApp: e.Application) => {
  expressApp.post("route", async (_req, _res) => {
    // logic
  });
};

export { setRoutes };
