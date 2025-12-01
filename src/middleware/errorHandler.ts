import { NextFunction, Request, Response } from "express";
import { logger } from "../config/logger";

export const errorHandler = (err: Error, _req: Request, res: Response, _next: NextFunction) => {
  logger.error("Unhandled error", err);
  return res.status(500).json({ message: "Something went wrong", detail: err.message });
};
