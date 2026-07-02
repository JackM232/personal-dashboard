import express from "express";
import cors from "cors";
import { modules } from "./modules";

export const app = express();

app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

for (const mod of modules) {
  app.use(mod.basePath, mod.router);
}
