import { Request } from "express";
import { prisma } from "../config/prisma";

type AuditPayload = {
  tableName: string;
  action: string;
  entityId?: string;
  description?: string;
};

export async function logAction(req: Request, payload: AuditPayload) {
  try {
    const userId = (req as any).user?.id || null;
    const ip = req.ip || (req.headers["x-forwarded-for"] as string) || null;
    const ua = (req.headers["user-agent"] as string) || null;

    const rev = await prisma.revInfo.create({
      data: {
        userId,
        ipAddress: ip,
        userAgent: ua,
      },
    });

    await prisma.aHistorique.create({
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
  } catch (err) {
    // Swallow audit errors to not block main flow
    console.error("Audit log failure", err);
  }
}

export async function logConnexion(data: {
  userId?: string | null;
  email?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  success: boolean;
}) {
  try {
    await prisma.aConnexion.create({
      data,
    });
  } catch (err) {
    console.error("Connexion log failure", err);
  }
}
