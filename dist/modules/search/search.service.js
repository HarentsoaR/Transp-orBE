"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SearchService = void 0;
const elasticsearch_1 = require("../../config/elasticsearch");
const prisma_1 = require("../../config/prisma");
const DEFAULT_INDEX = "transport-backoffice";
const client = (0, elasticsearch_1.getElasticClient)();
const ensureIndex = async (index) => {
    if (!client)
        return;
    const exists = await client.indices.exists({ index });
    if (!exists) {
        await client.indices.create({ index });
    }
};
exports.SearchService = {
    isEnabled: Boolean(client),
    async search(query, index = DEFAULT_INDEX) {
        if (!client)
            throw new Error("Elasticsearch not configured");
        await ensureIndex(index);
        const res = await client.search({
            index,
            query: { query_string: { query, default_operator: "AND" } },
        });
        return {
            hits: res.hits.hits.map((hit) => ({
                id: hit._id,
                score: hit._score ?? 0,
                ...hit._source,
            })),
            total: typeof res.hits.total === "number" ? res.hits.total : res.hits.total?.value ?? 0,
        };
    },
    async reindex(index = DEFAULT_INDEX) {
        if (!client)
            throw new Error("Elasticsearch not configured");
        await ensureIndex(index);
        const [routes, trips, reservations] = await Promise.all([
            prisma_1.prisma.route.findMany(),
            prisma_1.prisma.trip.findMany({ include: { route: true, bus: true, driver: true } }),
            prisma_1.prisma.reservation.findMany({
                include: { traveler: true, trip: { include: { route: true } } },
            }),
        ]);
        const docs = [
            ...routes.map((route) => ({
                id: `route-${route.id}`,
                type: "route",
                origin: route.origin,
                destination: route.destination,
                basePrice: route.basePrice,
            })),
            ...trips.map((trip) => ({
                id: `trip-${trip.id}`,
                type: "trip",
                route: `${trip.route.origin} ${trip.route.destination}`,
                departureTime: trip.departureTime,
                driver: `${trip.driver.firstName} ${trip.driver.lastName}`,
                bus: trip.bus.plateNumber,
                status: trip.status,
            })),
            ...reservations.map((res) => ({
                id: `reservation-${res.id}`,
                type: "reservation",
                traveler: res.traveler.fullName,
                phone: res.traveler.phone,
                trip: `${res.trip.route.origin}-${res.trip.route.destination}`,
                status: res.status,
                seatNumber: res.seatNumber,
            })),
        ];
        const body = docs.flatMap((doc) => [{ index: { _index: index, _id: doc.id } }, doc]);
        if (body.length === 0)
            return { indexed: 0 };
        const result = await client.bulk({ refresh: true, operations: body });
        if (result.errors) {
            const errors = result.items.filter((i) => i.index?.error);
            throw new Error(`Reindex errors: ${errors.length}`);
        }
        return { indexed: docs.length };
    },
};
