"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logAction = logAction;
exports.logConnexion = logConnexion;
const prisma_1 = require("../config/prisma");
async function logAction(req, payload) {
    try {
        const userId = req.user?.id || null;
        const ip = req.ip || req.headers["x-forwarded-for"] || null;
        const ua = req.headers["user-agent"] || null;
        const rev = await prisma_1.prisma.revInfo.create({
            data: {
                userId,
                ipAddress: ip,
                userAgent: ua,
            },
        });
        await prisma_1.prisma.aHistorique.create({
            data: {
                revId: rev.id,
                userId,
                tableName: payload.tableName,
                action: payload.action,
                entityId: payload.entityId,
                description: payload.description,
                ipAddress: ip,
                userAgent: ua,
            },
        });
    }
    catch (err) {
        // Swallow audit errors to not block main flow
        console.error("Audit log failure", err);
    }
}
async function logConnexion(data) {
    try {
        await prisma_1.prisma.aConnexion.create({
            data,
        });
    }
    catch (err) {
        console.error("Connexion log failure", err);
    }
}
