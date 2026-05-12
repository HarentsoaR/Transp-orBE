import { prisma } from "../../config/prisma";

export type ActivityItem = {
  id: string;
  actor: string;
  action: string;
  target: string;
  createdAt: string;
};

export type AlertItem = {
  id: string;
  title: string;
  description: string;
  severity: "low" | "medium" | "high";
  entityId?: string;
  createdAt: string;
};

export type RelatedItem = {
  id: string;
  type: "reservation" | "trip" | "payment" | "incident";
  label: string;
  status: string;
  date: string;
};

export type QueueItem = {
  id: string;
  title: string;
  description: string;
  priority: "Haute" | "Moyenne" | "Basse";
  actionLabel: string;
};

export type InsightsResponse = {
  activity: ActivityItem[];
  alerts: AlertItem[];
  related: RelatedItem[];
  queue: QueueItem[];
};

const formatDate = (value: Date) => value.toLocaleDateString("fr-FR");
const formatDateTime = (value: Date) => value.toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" });

const shortCode = (prefix: string, id: string) => `${prefix}-${id.slice(0, 6).toUpperCase()}`;

const loadActors = async (userIds: string[]) => {
  if (userIds.length === 0) return new Map<string, string>();
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, firstName: true, lastName: true, email: true },
  });
  return new Map(
    users.map((user) => [user.id, `${user.firstName} ${user.lastName}`.trim() || user.email])
  );
};

const activityFor = async (tableName: string) => {
  const logs = await prisma.aHistorique.findMany({
    where: { tableName },
    orderBy: { createdAt: "desc" },
    take: 6,
  });
  const userIds = Array.from(new Set(logs.map((log) => log.userId).filter(Boolean))) as string[];
  const actors = await loadActors(userIds);

  return logs.map((log) => ({
    id: log.id,
    actor: log.userId ? actors.get(log.userId) ?? "Utilisateur" : "Système",
    action: log.action,
    target: log.entityId ? `${log.tableName} ${log.entityId}` : log.tableName,
    createdAt: formatDateTime(log.createdAt),
  }));
};

export const InsightsService = {
  async get(entity: "drivers" | "vehicles" | "travelers"): Promise<InsightsResponse> {
    if (entity === "drivers") {
      const activity = await activityFor("driver");
      const now = new Date();
      const soon = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

      const [driversExpiring, trips] = await Promise.all([
        prisma.driver.findMany({
          where: { licenseExpiry: { lte: soon } },
          orderBy: { licenseExpiry: "asc" },
          take: 5,
        }),
        prisma.trip.findMany({
          where: { departureTime: { gte: now } },
          include: { route: true },
          orderBy: { departureTime: "asc" },
          take: 5,
        }),
      ]);

      const alerts: AlertItem[] = driversExpiring.map((driver) => ({
        id: `lic-${driver.id}`,
        title: "Permis à renouveler",
        description: `${driver.firstName} ${driver.lastName}`,
        severity: driver.licenseExpiry && driver.licenseExpiry < now ? "high" : "medium",
        entityId: driver.id,
        createdAt: driver.licenseExpiry ? formatDateTime(driver.licenseExpiry) : formatDateTime(now),
      }));

      const related: RelatedItem[] = trips.map((trip) => ({
        id: trip.id,
        type: "trip",
        label: shortCode("TRP", trip.id),
        status: trip.status,
        date: formatDate(trip.departureTime),
      }));

      const queue: QueueItem[] = driversExpiring.map((driver) => ({
        id: `queue-${driver.id}`,
        title: "Permis à renouveler",
        description: `${driver.firstName} ${driver.lastName}`,
        priority: driver.licenseExpiry && driver.licenseExpiry < now ? "Haute" : "Moyenne",
        actionLabel: "Notifier",
      }));

      return { activity, alerts, related, queue };
    }

    if (entity === "vehicles") {
      const activity = await activityFor("bus");
      const now = new Date();
      const soon = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

      const [buses, insurance, trips] = await Promise.all([
        prisma.bus.findMany({ where: { status: { in: ["OUT_OF_SERVICE", "RETIRED"] } }, take: 5 }),
        prisma.bus.findMany({
          where: { insuranceExpiry: { lte: soon } },
          orderBy: { insuranceExpiry: "asc" },
          take: 5,
        }),
        prisma.trip.findMany({
          where: { departureTime: { gte: now } },
          include: { route: true },
          orderBy: { departureTime: "asc" },
          take: 5,
        }),
      ]);

      const alerts: AlertItem[] = [
        ...buses.map<AlertItem>((bus) => ({
          id: `bus-${bus.id}`,
          title: "Véhicule indisponible",
          description: `${bus.plateNumber}`,
          severity: "high",
          entityId: bus.id,
          createdAt: formatDateTime(now),
        })),
        ...insurance.map<AlertItem>((bus) => ({
          id: `ins-${bus.id}`,
          title: "Assurance à renouveler",
          description: `${bus.plateNumber}`,
          severity: "medium",
          entityId: bus.id,
          createdAt: bus.insuranceExpiry ? formatDateTime(bus.insuranceExpiry) : formatDateTime(now),
        })),
      ];

      const related: RelatedItem[] = trips.map((trip) => ({
        id: trip.id,
        type: "trip",
        label: shortCode("TRP", trip.id),
        status: trip.status,
        date: formatDate(trip.departureTime),
      }));

      const queue: QueueItem[] = buses.map((bus) => ({
        id: `queue-${bus.id}`,
        title: "Véhicule indisponible",
        description: `${bus.plateNumber}`,
        priority: "Haute",
        actionLabel: "Planifier",
      }));

      return { activity, alerts, related, queue };
    }

    const activity = await activityFor("traveler");
    const now = new Date();
    const [blacklisted, reservations] = await Promise.all([
      prisma.traveler.findMany({ where: { status: "BLACKLISTED" }, take: 5 }),
      prisma.reservation.findMany({
        orderBy: { createdAt: "desc" },
        include: { trip: { include: { route: true } } },
        take: 5,
      }),
    ]);

    const alerts: AlertItem[] = blacklisted.map((traveler) => ({
      id: `blk-${traveler.id}`,
      title: "Voyageur en liste noire",
      description: traveler.fullName,
      severity: "high",
      entityId: traveler.id,
      createdAt: formatDateTime(now),
    }));

    const related: RelatedItem[] = reservations.map((res) => ({
      id: res.id,
      type: "reservation",
      label: shortCode("RSV", res.id),
      status: res.status,
      date: formatDate(res.createdAt),
    }));

    const queue: QueueItem[] = blacklisted.map((traveler) => ({
      id: `queue-${traveler.id}`,
      title: "Vérifier dossier",
      description: traveler.fullName,
      priority: "Moyenne",
      actionLabel: "Examiner",
    }));

    return { activity, alerts, related, queue };
  },
};
