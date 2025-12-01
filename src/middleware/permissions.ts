import { NextFunction, Request, Response } from "express";

export const requirePermissions = (codes: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const permissions = req.user?.profile?.permissions?.map((p) => p.code) ?? [];
    const hasAll = codes.every((code) => permissions.includes(code));
    if (!hasAll) {
      return res.status(403).json({ message: "Insufficient permissions" });
    }
    return next();
  };
};

export const requireAnyPermission = (codes: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const permissions = req.user?.profile?.permissions?.map((p) => p.code) ?? [];
    const hasOne = codes.some((code) => permissions.includes(code));
    if (!hasOne) {
      return res.status(403).json({ message: "Insufficient permissions" });
    }
    return next();
  };
};
