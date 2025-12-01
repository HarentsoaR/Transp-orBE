import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { prisma } from "../config/prisma";
import { env } from "../config/env";
import { AuthUser } from "../types/auth";

type TokenPayload = { userId: string };

export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Missing or invalid authorization header" });
  }

  const token = authHeader.substring("Bearer ".length);
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as TokenPayload;
    const user = await prisma.user.findUnique({
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

    const authUser: AuthUser = {
      id: user.id,
      email: user.email,
      profile: user.profile
        ? {
            id: user.profile.id,
            name: user.profile.name,
            permissions: user.profile.permissions.map((p: { permission: { code: string } }) => ({
              code: p.permission.code,
            })),
          }
        : undefined,
    };

    req.user = authUser;
    return next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};
