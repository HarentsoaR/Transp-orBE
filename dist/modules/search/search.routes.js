"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.searchRouter = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const search_service_1 = require("./search.service");
const validate_1 = require("../../middleware/validate");
const permissions_1 = require("../../middleware/permissions");
exports.searchRouter = (0, express_1.Router)();
const reindexSchema = zod_1.z.object({
    index: zod_1.z.string().optional(),
});
exports.searchRouter.get("/", async (req, res) => {
    if (!search_service_1.SearchService.isEnabled)
        return res.status(503).json({ message: "Search not configured" });
    const q = req.query.q ?? "*";
    try {
        const results = await search_service_1.SearchService.search(q, req.query.index ?? undefined);
        return res.json(results);
    }
    catch (error) {
        return res.status(400).json({ message: error.message ?? "Search failed" });
    }
});
exports.searchRouter.post("/reindex", (0, permissions_1.requirePermissions)(["search.manage"]), (0, validate_1.validateBody)(reindexSchema), async (req, res) => {
    if (!search_service_1.SearchService.isEnabled)
        return res.status(503).json({ message: "Search not configured" });
    try {
        const result = await search_service_1.SearchService.reindex(req.body.index);
        return res.json(result);
    }
    catch (error) {
        return res.status(400).json({ message: error.message ?? "Reindex failed" });
    }
});
