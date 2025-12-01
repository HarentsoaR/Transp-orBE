"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BusService = void 0;
const prisma_1 = require("../../config/prisma");
exports.BusService = {
    list() {
        return prisma_1.prisma.bus.findMany({ orderBy: { plateNumber: "asc" } });
    },
    create(input) {
        return prisma_1.prisma.bus.create({ data: input });
    },
    update(id, input) {
        return prisma_1.prisma.bus.update({ where: { id }, data: input });
    },
    async remove(id) {
        const tripCount = await prisma_1.prisma.trip.count({ where: { busId: id } });
        if (tripCount > 0) {
            throw new Error("Impossible de supprimer: bus lié à des trajets");
        }
        return prisma_1.prisma.bus.delete({ where: { id } });
    },
};
