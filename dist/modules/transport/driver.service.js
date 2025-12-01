"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DriverService = void 0;
const prisma_1 = require("../../config/prisma");
exports.DriverService = {
    list() {
        return prisma_1.prisma.driver.findMany({ include: { assignedBus: true } });
    },
    create(input) {
        return prisma_1.prisma.driver.create({ data: input });
    },
    update(id, input) {
        return prisma_1.prisma.driver.update({ where: { id }, data: input });
    },
    async remove(id) {
        const tripCount = await prisma_1.prisma.trip.count({ where: { driverId: id } });
        if (tripCount > 0) {
            throw new Error("Impossible de supprimer: conducteur lié à des trajets");
        }
        return prisma_1.prisma.driver.delete({ where: { id } });
    },
};
