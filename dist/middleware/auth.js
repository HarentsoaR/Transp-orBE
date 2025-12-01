"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prisma_1 = require("../config/prisma");
const env_1 = require("../config/env");
const authenticate = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
        return res.status(401).json({ message: "Missing or invalid authorization header" });
    }
    const token = authHeader.substring("Bearer ".length);
    try {
        const decoded = jsonwebtoken_1.default.verify(token, env_1.env.JWT_SECRET);
        const user = await prisma_1.prisma.user.findUnique({
            where: { id: decoded.userId },
            include: {
                profile: {
                    include: {
                        permissions: { include: { permission: true } },
                    },
                },
            },
        });
        if (!user) {
            return res.status(401).json({ message: "User not found" });
        }
        const authUser = {
            id: user.id,
            email: user.email,
            profile: user.profile
                ? {
                    id: user.profile.id,
                    name: user.profile.name,
                    permissions: user.profile.permissions.map((p) => ({
                        code: p.permission.code,
                    })),
                }
                : undefined,
        };
        req.user = authUser;
        return next();
    }
    catch (error) {
        return res.status(401).json({ message: "Invalid or expired token" });
    }
};
exports.authenticate = authenticate;
