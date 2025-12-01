"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TravelerService = void 0;
const prisma_1 = require("../../config/prisma");
exports.TravelerService = {
    list() {
        return prisma_1.prisma.traveler.findMany({ orderBy: { fullName: "asc" } });
    },
    create(input) {
        return prisma_1.prisma.traveler.create({ data: input });
    },
    update(id, input) {
        return prisma_1.prisma.traveler.update({ where: { id }, data: input });
    },
    async remove(id) {
        const resCount = await prisma_1.prisma.reservation.count({ where: { travelerId: id } });
        if (resCount > 0) {
            throw new Error("Impossible de supprimer: voyageur lié à des réservations");
        }
        return prisma_1.prisma.traveler.delete({ where: { id } });
    },
};
