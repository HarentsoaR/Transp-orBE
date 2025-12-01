"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prisma_1 = require("../../config/prisma");
const env_1 = require("../../config/env");
const audit_1 = require("../../utils/audit");
const travelerProfileName = "TRAVELER";
const toAuthUser = (user) => ({
    id: user.id,
    email: user.email,
    profile: user.profile
        ? {
            id: user.profile.id,
            name: user.profile.name,
            permissions: user.profile.permissions.map((p) => ({ code: p.permission.code })),
        }
        : undefined,
});
const signToken = (userId) => jsonwebtoken_1.default.sign({ userId }, env_1.env.JWT_SECRET, { expiresIn: "7d" });
exports.AuthService = {
    async registerTraveler(input) {
        const existing = await prisma_1.prisma.user.findUnique({ where: { email: input.email } });
        if (existing) {
            throw new Error("User already exists with that email");
        }
        const profile = await prisma_1.prisma.profile.upsert({
            where: { name: travelerProfileName },
            update: {},
            create: { name: travelerProfileName, description: "Default traveler profile" },
        });
        const passwordHash = await bcryptjs_1.default.hash(input.password, 10);
        const user = await prisma_1.prisma.user.create({
            data: {
                email: input.email,
                phone: input.phone,
                passwordHash,
                firstName: input.firstName,
                lastName: input.lastName,
                profileId: profile.id,
                traveler: {
                    create: {
                        fullName: `${input.firstName} ${input.lastName}`,
                        phone: input.phone ?? "",
                        email: input.email,
                    },
                },
            },
            include: {
                profile: { include: { permissions: { include: { permission: true } } } },
            },
        });
        const token = signToken(user.id);
        return { token, user: toAuthUser(user) };
    },
    async login(input) {
        const user = await prisma_1.prisma.user.findUnique({
            where: { email: input.email },
            include: {
                profile: { include: { permissions: { include: { permission: true } } } },
            },
        });
        if (!user) {
            await prisma_1.prisma.loginLog.create({
                data: { success: false, ipAddress: input.ip, userAgent: input.userAgent },
            }).catch(() => null);
            await (0, audit_1.logConnexion)({
                success: false,
                userId: null,
                email: input.email,
                ipAddress: input.ip,
                userAgent: input.userAgent,
            });
            throw new Error("Invalid credentials");
        }
        const valid = await bcryptjs_1.default.compare(input.password, user.passwordHash);
        await prisma_1.prisma.loginLog
            .create({
            data: {
                userId: user.id,
                success: valid,
                ipAddress: input.ip,
                userAgent: input.userAgent,
            },
        })
            .catch(() => null);
        await (0, audit_1.logConnexion)({
            success: valid,
            userId: user.id,
            email: user.email,
            ipAddress: input.ip,
            userAgent: input.userAgent,
        });
        if (!valid) {
            throw new Error("Invalid credentials");
        }
        const token = signToken(user.id);
        return { token, user: toAuthUser(user) };
    },
};
