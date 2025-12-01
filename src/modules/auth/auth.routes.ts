import { Router } from "express";
import { z } from "zod";
import { AuthController } from "./auth.controller";
import { validateBody } from "../../middleware/validate";

export const authRouter = Router();

const registerSchema = z.object({
  email: z.string().email(),
  phone: z.string().optional(),
  password: z.string().min(8),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

authRouter.post("/register", validateBody(registerSchema), AuthController.registerTraveler);
authRouter.post("/login", validateBody(loginSchema), AuthController.login);
