import { getElasticClient } from "../../config/elasticsearch";
import { prisma } from "../../config/prisma";

const DEFAULT_INDEX = "transport-backoffice";

type SearchResult = {
  hits: any[];
  total: number;
};

const client = getElasticClient();
type SearchDoc = Record<string, unknown>;

const ensureIndex = async (index: string) => {
  if (!client) return;
  const exists = await client.indices.exists({ index });
  if (!exists) {
    await client.indices.create({ index });
  }
};

export const SearchService = {
  isEnabled: Boolean(client),

  async search(query: string, index = DEFAULT_INDEX): Promise<SearchResult> {
    if (!client) throw new Error("Elasticsearch not configured");
    await ensureIndex(index);
    const res = await client.search({
      index,
      query: { query_string: { query, default_operator: "AND" } },
    });
    return {
      hits: res.hits.hits.map((hit) => ({
        id: hit._id,
        score: hit._score ?? 0,
        ...(hit._source as SearchDoc),
      })),
      total: typeof res.hits.total === "number" ? res.hits.total : res.hits.total?.value ?? 0,
    };
  },

  async reindex(index = DEFAULT_INDEX) {
    if (!client) throw new Error("Elasticsearch not configured");
    await ensureIndex(index);

    const [routes, trips, reservations] = await Promise.all([
      prisma.route.findMany(),
      prisma.trip.findMany({ include: { route: true, bus: true, driver: true } }),
      prisma.reservation.findMany({
        include: { traveler: true, trip: { include: { route: true } } },
      }),
    ]);

    const docs: SearchDoc[] = [
      ...routes.map<SearchDoc>((route) => ({
        id: `route-${route.id}`,
        type: "route",
        origin: route.origin,
        destination: route.destination,
        basePrice: route.basePrice,
      })),
      ...trips.map<SearchDoc>((trip) => ({
        id: `trip-${trip.id}`,
        type: "trip",
        route: `${trip.route.origin} ${trip.route.destination}`,
        departureTime: trip.departureTime,
        driver: `${trip.driver.firstName} ${trip.driver.lastName}`,
        bus: trip.bus.plateNumber,
        status: trip.status,
      })),
      ...reservations.map<SearchDoc>((res) => ({
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
    if (body.length === 0) return { indexed: 0 };

    const result = await client.bulk({ refresh: true, operations: body });
    if (result.errors) {
      const errors = result.items.filter((i) => (i.index as any)?.error);
      throw new Error(`Reindex errors: ${errors.length}`);
    }
    return { indexed: docs.length };
  },
};
