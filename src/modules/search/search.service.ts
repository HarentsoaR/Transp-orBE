import { getElasticClient } from "../../config/elasticsearch";
import { prisma } from "../../config/prisma";

const DEFAULT_INDEX = "transport-backoffice";

type SearchResultItem = {
  id: string;
  type: "reservation" | "trip" | "vehicle" | "driver" | "client";
  label: string;
  meta: string;
  href: string;
};

type SearchResult = {
  hits: SearchResultItem[];
  total: number;
};

const client = getElasticClient();
type SearchDoc = SearchResultItem;

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
      hits: res.hits.hits.map((hit) => {
        const source = hit._source as SearchDoc;
        const id = (hit._id ?? source.id) as string;
        return {
          ...source,
          id,
        };
      }),
      total: typeof res.hits.total === "number" ? res.hits.total : res.hits.total?.value ?? 0,
    };
  },

  async reindex(index = DEFAULT_INDEX) {
    if (!client) throw new Error("Elasticsearch not configured");
    await ensureIndex(index);

    const [routes, trips, reservations, drivers, buses, travelers] = await Promise.all([
      prisma.route.findMany(),
      prisma.trip.findMany({ include: { route: true, bus: true, driver: true } }),
      prisma.reservation.findMany({
        include: { traveler: true, trip: { include: { route: true } } },
      }),
      prisma.driver.findMany(),
      prisma.bus.findMany(),
      prisma.traveler.findMany(),
    ]);

    const docs: SearchDoc[] = [
      ...routes.map<SearchDoc>((route) => ({
        id: `route-${route.id}`,
        type: "trip",
        label: `Itinéraire ${route.origin} → ${route.destination}`,
        meta: `Base ${Number(route.basePrice).toLocaleString("fr-FR")} Ar`,
        href: `/cooperative_management/history?route=${route.id}`,
      })),
      ...trips.map<SearchDoc>((trip) => ({
        id: `trip-${trip.id}`,
        type: "trip",
        label: `Trajet ${trip.route.origin} → ${trip.route.destination}`,
        meta: `Départ ${trip.departureTime.toISOString()} · ${trip.bus.plateNumber}`,
        href: `/cooperative_management/history?trip=${trip.id}`,
      })),
      ...reservations.map<SearchDoc>((res) => ({
        id: `reservation-${res.id}`,
        type: "reservation",
        label: `Réservation ${res.traveler.fullName}`,
        meta: `${res.trip.route.origin} → ${res.trip.route.destination} · Siège ${res.seatNumber ?? "-"}`,
        href: `/user`,
      })),
      ...drivers.map<SearchDoc>((driver) => ({
        id: `driver-${driver.id}`,
        type: "driver",
        label: `Conducteur ${driver.firstName} ${driver.lastName}`,
        meta: driver.phone,
        href: `/cooperative_management/driver?search=${encodeURIComponent(driver.lastName)}`,
      })),
      ...buses.map<SearchDoc>((bus) => ({
        id: `bus-${bus.id}`,
        type: "vehicle",
        label: `Bus ${bus.plateNumber}`,
        meta: `Capacité ${bus.capacity}`,
        href: `/cooperative_management/vehicule?search=${encodeURIComponent(bus.plateNumber)}`,
      })),
      ...travelers.map<SearchDoc>((traveler) => ({
        id: `traveler-${traveler.id}`,
        type: "client",
        label: `Voyageur ${traveler.fullName}`,
        meta: traveler.phone,
        href: `/cooperative_management/traveler?search=${encodeURIComponent(traveler.fullName)}`,
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

  async searchFallback(query: string): Promise<SearchResultItem[]> {
    const normalized = query.trim();
    const contains = normalized
      ? { contains: normalized, mode: "insensitive" as const }
      : undefined;
    if (!contains) return [];

    const [trips, reservations, drivers, buses, travelers] = await Promise.all([
      prisma.trip.findMany({
        where: {
          route: {
            is: {
              OR: [{ origin: contains }, { destination: contains }],
            },
          },
        },
        include: { route: true, bus: true },
        take: 5,
      }),
      prisma.reservation.findMany({
        where: {
          traveler: {
            is: {
              OR: [{ fullName: contains }, { phone: contains }],
            },
          },
        },
        include: { traveler: true, trip: { include: { route: true } } },
        take: 5,
      }),
      prisma.driver.findMany({
        where: {
          OR: [{ firstName: contains }, { lastName: contains }, { phone: contains }],
        },
        take: 5,
      }),
      prisma.bus.findMany({
        where: { OR: [{ plateNumber: contains }, { brand: contains }, { model: contains }] },
        take: 5,
      }),
      prisma.traveler.findMany({
        where: { OR: [{ fullName: contains }, { phone: contains }] },
        take: 5,
      }),
    ]);

    return [
      ...trips.map<SearchResultItem>((trip) => ({
        id: `trip-${trip.id}`,
        type: "trip",
        label: `Trajet ${trip.route.origin} → ${trip.route.destination}`,
        meta: `Départ ${trip.departureTime.toISOString()} · ${trip.bus.plateNumber}`,
        href: `/cooperative_management/history?trip=${trip.id}`,
      })),
      ...reservations.map<SearchResultItem>((res) => ({
        id: `reservation-${res.id}`,
        type: "reservation",
        label: `Réservation ${res.traveler.fullName}`,
        meta: `${res.trip.route.origin} → ${res.trip.route.destination} · Siège ${res.seatNumber ?? "-"}`,
        href: `/user`,
      })),
      ...drivers.map<SearchResultItem>((driver) => ({
        id: `driver-${driver.id}`,
        type: "driver",
        label: `Conducteur ${driver.firstName} ${driver.lastName}`,
        meta: driver.phone,
        href: `/cooperative_management/driver?search=${encodeURIComponent(driver.lastName)}`,
      })),
      ...buses.map<SearchResultItem>((bus) => ({
        id: `bus-${bus.id}`,
        type: "vehicle",
        label: `Bus ${bus.plateNumber}`,
        meta: `Capacité ${bus.capacity}`,
        href: `/cooperative_management/vehicule?search=${encodeURIComponent(bus.plateNumber)}`,
      })),
      ...travelers.map<SearchResultItem>((traveler) => ({
        id: `traveler-${traveler.id}`,
        type: "client",
        label: `Voyageur ${traveler.fullName}`,
        meta: traveler.phone,
        href: `/cooperative_management/traveler?search=${encodeURIComponent(traveler.fullName)}`,
      })),
    ];
  },
};
