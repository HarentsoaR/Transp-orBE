import { createApp } from "./app";
import { env } from "./config/env";
import { logger } from "./config/logger";
import { prisma } from "./config/prisma";

const app = createApp();

const start = async () => {
  try {
    await prisma.$connect();
    app.listen(env.PORT, () => {
      logger.info(`API running on http://localhost:${env.PORT}`);
    });
  } catch (error) {
    logger.error("Failed to start server", error);
    process.exit(1);
  }
};

start();
