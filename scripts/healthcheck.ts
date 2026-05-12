import request from "supertest";
import { createApp } from "../src/app";

const run = async () => {
  const app = createApp();
  const res = await request(app).get("/health");
  if (res.status !== 200 || res.body?.ok !== true) {
    console.error("Health check failed", res.status, res.body);
    process.exit(1);
  }
  console.log("Health check OK");
};

run().catch((err) => {
  console.error("Health check error", err);
  process.exit(1);
});
