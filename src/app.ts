import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import { errorHandler } from "./middleware/errorHandler";
import { routes } from "./routes";
import { env } from "./config/env";

export const createApp = () => {
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin: [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        env.ELASTICSEARCH_NODE ?? "",
      ].filter(Boolean),
      credentials: true,
    })
  );
  app.use(express.json());
  app.use(morgan("tiny"));

  app.get("/health", (_req, res) => res.json({ ok: true }));

  app.use("/api", routes);

  app.use(errorHandler);

  return app;
};
