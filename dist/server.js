"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = require("./app");
const env_1 = require("./config/env");
const logger_1 = require("./config/logger");
const prisma_1 = require("./config/prisma");
const app = (0, app_1.createApp)();
const start = async () => {
    try {
        await prisma_1.prisma.$connect();
        app.listen(env_1.env.PORT, () => {
            logger_1.logger.info(`API running on http://localhost:${env_1.env.PORT}`);
        });
    }
    catch (error) {
        logger_1.logger.error("Failed to start server", error);
        process.exit(1);
    }
};
start();
