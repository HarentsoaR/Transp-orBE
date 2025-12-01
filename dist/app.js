"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createApp = void 0;
const cors_1 = __importDefault(require("cors"));
const express_1 = __importDefault(require("express"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const errorHandler_1 = require("./middleware/errorHandler");
const routes_1 = require("./routes");
const env_1 = require("./config/env");
const createApp = () => {
    const app = (0, express_1.default)();
    app.use((0, helmet_1.default)());
    app.use((0, cors_1.default)({
        origin: [
            "http://localhost:3000",
            "http://127.0.0.1:3000",
            env_1.env.ELASTICSEARCH_NODE ?? "",
        ].filter(Boolean),
        credentials: true,
    }));
    app.use(express_1.default.json());
    app.use((0, morgan_1.default)("tiny"));
    app.get("/health", (_req, res) => res.json({ ok: true }));
    app.use("/api", routes_1.routes);
    app.use(errorHandler_1.errorHandler);
    return app;
};
exports.createApp = createApp;
