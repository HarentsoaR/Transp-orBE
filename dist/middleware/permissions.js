"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAnyPermission = exports.requirePermissions = void 0;
const requirePermissions = (codes) => {
    return (req, res, next) => {
        const permissions = req.user?.profile?.permissions?.map((p) => p.code) ?? [];
        const hasAll = codes.every((code) => permissions.includes(code));
        if (!hasAll) {
            return res.status(403).json({ message: "Insufficient permissions" });
        }
        return next();
    };
};
exports.requirePermissions = requirePermissions;
const requireAnyPermission = (codes) => {
    return (req, res, next) => {
        const permissions = req.user?.profile?.permissions?.map((p) => p.code) ?? [];
        const hasOne = codes.some((code) => permissions.includes(code));
        if (!hasOne) {
            return res.status(403).json({ message: "Insufficient permissions" });
        }
        return next();
    };
};
exports.requireAnyPermission = requireAnyPermission;
