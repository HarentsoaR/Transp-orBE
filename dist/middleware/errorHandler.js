"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = void 0;
const logger_1 = require("../config/logger");
const errorHandler = (err, _req, res, _next) => {
    logger_1.logger.error("Unhandled error", err);
    return res.status(500).json({ message: "Something went wrong", detail: err.message });
};
exports.errorHandler = errorHandler;
