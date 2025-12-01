import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../../config/prisma";
import { env } from "../../config/env";
import { AuthUser } from "../../types/auth";
import { logConnexion } from "../../utils/audit";

type RegisterTravelerInput = {
  email: string;
  phone?: string;
  password: string;
  firstName: string;
  lastName: string;
};

type LoginInput = {
  email: string;
  password: string;
  ip?: string;
  userAgent?: string;
};

const travelerProfileName = "TRAVELER";

const toAuthUser = (user: any): AuthUser => ({
  id: user.id,
  email: user.email,
  profile: user.profile
    ? {
        id: user.profile.id,
        name: user.profile.name,
        permissions: user.profile.permissions.map((p: any) => ({ code: p.permission.code })),
      }
    : undefined,
});

const signToken = (userId: string) => jwt.sign({ userId }, env.JWT_SECRET, { expiresIn: "7d" });

export const AuthService = {
  async registerTraveler(input: RegisterTravelerInput) {
    const existing = await prisma.user.findUnique({ where: { email: input.email } });
    if (existing) {
      throw new Error("User already exists with that email");
    }

    const profile = await prisma.profile.upsert({
      where: { name: travelerProfileName },
      update: {},
      create: { name: travelerProfileName, description: "Default traveler profile" },
    });

    const passwordHash = await bcrypt.hash(input.password, 10);

    const user = await prisma.user.create({
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

  async login(input: LoginInput) {
    const user = await prisma.user.findUnique({
      where: { email: input.email },
      include: {
        profile: { include: { permissions: { include: { permission: true } } } },
      },
    });

    if (!user) {
      await prisma.loginLog.create({
        data: { success: false, ipAddress: input.ip, userAgent: input.userAgent },
      }).catch(() => null);
      await logConnexion({
        success: false,
        userId: null,
        email: input.email,
        ipAddress: input.ip,
        userAgent: input.userAgent,
      });
      throw new Error("Invalid credentials");
    }

    const valid = await bcrypt.compare(input.password, user.passwordHash);
    await prisma.loginLog
      .create({
        data: {
          userId: user.id,
          success: valid,
          ipAddress: input.ip,
          userAgent: input.userAgent,
        },
      })
      .catch(() => null);

    await logConnexion({
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
