"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateBody = void 0;
const validateBody = (schema) => {
    return (req, res, next) => {
        const parsed = schema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({ message: "Invalid request body", errors: parsed.error.flatten() });
        }
        req.body = parsed.data;
        return next();
    };
};
exports.validateBody = validateBody;
