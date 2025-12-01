"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRouter = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const auth_controller_1 = require("./auth.controller");
const validate_1 = require("../../middleware/validate");
exports.authRouter = (0, express_1.Router)();
const registerSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    phone: zod_1.z.string().optional(),
    password: zod_1.z.string().min(8),
    firstName: zod_1.z.string().min(1),
    lastName: zod_1.z.string().min(1),
});
const loginSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(1),
});
exports.authRouter.post("/register", (0, validate_1.validateBody)(registerSchema), auth_controller_1.AuthController.registerTraveler);
exports.authRouter.post("/login", (0, validate_1.validateBody)(loginSchema), auth_controller_1.AuthController.login);
