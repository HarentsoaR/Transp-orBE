import { Request, Response } from "express";
import { AuthService } from "./auth.service";

export const AuthController = {
  registerTraveler: async (req: Request, res: Response) => {
    try {
      const result = await AuthService.registerTraveler(req.body);
      return res.status(201).json(result);
    } catch (error: any) {
      return res.status(400).json({ message: error.message ?? "Unable to register traveler" });
    }
  },

  login: async (req: Request, res: Response) => {
    try {
      const result = await AuthService.login({
        ...req.body,
        ip: req.ip,
        userAgent: req.get("user-agent") ?? undefined,
      });
      return res.json(result);
    } catch (error: any) {
      return res.status(401).json({ message: error.message ?? "Unable to login" });
    }
  },
};
