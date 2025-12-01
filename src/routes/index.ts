import { Router } from "express";
import { authRouter } from "../modules/auth/auth.routes";
import { transportRouter } from "../modules/transport/transport.routes";
import { searchRouter } from "../modules/search/search.routes";
import { authenticate } from "../middleware/auth";

export const routes = Router();

routes.use("/auth", authRouter);
routes.use("/transport", transportRouter);
routes.use("/search", authenticate, searchRouter);
