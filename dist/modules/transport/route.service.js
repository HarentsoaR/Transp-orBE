"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RouteService = void 0;
const prisma_1 = require("../../config/prisma");
exports.RouteService = {
    list() {
        return prisma_1.prisma.route.findMany({ orderBy: [{ origin: "asc" }, { destination: "asc" }] });
    },
    get(id) {
        return prisma_1.prisma.route.findUnique({ where: { id } });
    },
    create(input) {
        return prisma_1.prisma.route.create({ data: input });
    },
    update(id, input) {
        return prisma_1.prisma.route.update({ where: { id }, data: input });
    },
    async remove(id) {
        const tripCount = await prisma_1.prisma.trip.count({ where: { routeId: id } });
        if (tripCount > 0) {
            throw new Error("Impossible de supprimer: route liée à des trajets");
        }
        return prisma_1.prisma.route.delete({ where: { id } });
    },
};
