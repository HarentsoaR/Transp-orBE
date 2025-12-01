"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
exports.logger = {
    info: (msg, meta) => console.log(msg, meta ?? ""),
    error: (msg, meta) => console.error(msg, meta ?? ""),
};
