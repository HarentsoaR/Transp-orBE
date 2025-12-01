"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const zod_1 = require("zod");
dotenv_1.default.config();
const envSchema = zod_1.z.object({
    PORT: zod_1.z.coerce.number().default(4000),
    DATABASE_URL: zod_1.z.string().url(),
    JWT_SECRET: zod_1.z.string().min(16, "JWT_SECRET should be at least 16 chars"),
    ELASTICSEARCH_NODE: zod_1.z.string().url().optional(),
    ELASTICSEARCH_USERNAME: zod_1.z.string().optional(),
    ELASTICSEARCH_PASSWORD: zod_1.z.string().optional(),
});
exports.env = envSchema.parse(process.env);
