import { prisma } from "../../config/prisma";

const formatTime = (value: Date) =>
  value.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });

const formatDateTime = (value: Date) =>
  value.toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" });

const toTripStatus = (status: string) => {
  switch (status) {
    case "SCHEDULED":
      return "Scheduled";
    case "BOARDING":
      return "Boarding";
    case "DEPARTED":
      return "Departed";
    case "ARRIVED":
      return "Arrived";
    case "CANCELLED":
      return "Cancelled";
    default:
      return "Scheduled";
  }
};

const shortCode = (prefix: string, id: string) => `${prefix}-${id.slice(0, 6).toUpperCase()}`;

export const DashboardService = {
  async kpis() {
    const today = new Date();
    const start = new Date(today);
    start.setHours(0, 0, 0, 0);
    const end = new Date(today);
    end.setHours(23, 59, 59, 999);

    const [departures, arrivals, pendingConfirmations, vehiclesUnavailable] = await Promise.all([
      prisma.trip.count({ where: { departureTime: { gte: start, lte: end } } }),
      prisma.trip.count({ where: { arrivalTime: { gte: start, lte: end } } }),
      prisma.reservation.count({ where: { status: "CONFIRMED", checkIn: "PENDING" } }),
      prisma.bus.count({ where: { status: { in: ["OUT_OF_SERVICE", "RETIRED"] } } }),
    ]);

    return [
      {
        id: "departures_today",
        label: "Départs du jour",
        value: departures,
        helper: "Trajets planifiés aujourd'hui",
      },
      {
        id: "arrivals_today",
        label: "Arrivées du jour",
        value: arrivals,
        helper: "Arrivées enregistrées",
      },
      {
        id: "pending_confirmations",
        label: "Confirmations",
        value: pendingConfirmations,
        helper: "Réservations à confirmer",
      },
      {
        id: "pending_payments",
        label: "Paiements",
        value: 0,
        helper: "Module paiement non activé",
      },
      {
        id: "vehicles_unavailable",
        label: "Véhicules indisponibles",
        value: vehiclesUnavailable,
        helper: "Hors service ou retirés",
      },
      {
        id: "open_incidents",
        label: "Incidents ouverts",
        value: 0,
        helper: "Module incidents non activé",
      },
    ];
  },

  async actionQueue() {
    const now = new Date();
    const nextDay = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const reservations = await prisma.reservation.findMany({
      where: {
        status: "CONFIRMED",
        checkIn: "PENDING",
        trip: { departureTime: { gte: now, lte: nextDay } },
      },
      include: { traveler: true, trip: { include: { route: true } } },
      orderBy: { trip: { departureTime: "asc" } },
      take: 6,
    });

    return reservations.map((res) => {
      const hoursLeft = (res.trip.departureTime.getTime() - now.getTime()) / (1000 * 60 * 60);
      const priority = hoursLeft <= 6 ? "High" : hoursLeft <= 12 ? "Medium" : "Low";
      return {
        id: res.id,
        kind: "Confirmation",
        title: `Confirmer ${res.traveler.fullName}`,
        description: `Trajet ${res.trip.route.origin} → ${res.trip.route.destination}`,
        priority,
        dueAt: formatDateTime(res.trip.departureTime),
        reservationId: res.id,
        tripCode: shortCode("TRP", res.trip.id),
        client: res.traveler.fullName,
        route: `${res.trip.route.origin} → ${res.trip.route.destination}`,
      };
    });
  },

  async todayTrips() {
    const today = new Date();
    const start = new Date(today);
    start.setHours(0, 0, 0, 0);
    const end = new Date(today);
    end.setHours(23, 59, 59, 999);

    const trips = await prisma.trip.findMany({
      where: { departureTime: { gte: start, lte: end } },
      include: { route: true, bus: true, driver: true },
      orderBy: { departureTime: "asc" },
    });

    return trips.map((trip) => ({
      id: trip.id,
      code: shortCode("TRP", trip.id),
      departureTime: formatTime(trip.departureTime),
      arrivalTime: trip.arrivalTime ? formatTime(trip.arrivalTime) : undefined,
      route: { origin: trip.route.origin, destination: trip.route.destination },
      status: toTripStatus(trip.status),
      vehicle: trip.bus.plateNumber,
      driver: `${trip.driver.firstName} ${trip.driver.lastName}`,
      seatsUsed: trip.bus.capacity - trip.availableSeats,
      seatsTotal: trip.bus.capacity,
    }));
  },

  async activity() {
    const logs = await prisma.aHistorique.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    const userIds = Array.from(new Set(logs.map((log) => log.userId).filter(Boolean))) as string[];
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, firstName: true, lastName: true, email: true },
    });
    const userMap = new Map(
      users.map((user) => [user.id, `${user.firstName} ${user.lastName}`.trim() || user.email])
    );

    return logs.map((log) => ({
      id: log.id,
      actor: log.userId ? userMap.get(log.userId) ?? "Utilisateur" : "Système",
      action: log.action,
      target: log.entityId ? `${log.tableName} ${log.entityId}` : log.tableName,
      timestamp: formatDateTime(log.createdAt),
    }));
  },

  async alerts() {
    const now = new Date();
    const soon = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const [drivers, buses, insurance] = await Promise.all([
      prisma.driver.findMany({
        where: { licenseExpiry: { lte: soon } },
        orderBy: { licenseExpiry: "asc" },
        take: 3,
      }),
      prisma.bus.findMany({
        where: { status: { in: ["OUT_OF_SERVICE", "RETIRED"] } },
        take: 3,
      }),
      prisma.bus.findMany({
        where: { insuranceExpiry: { lte: soon } },
        orderBy: { insuranceExpiry: "asc" },
        take: 3,
      }),
    ]);

    const alerts = [
      ...drivers.map((driver) => ({
        id: `drv-${driver.id}`,
        title: `Permis à renouveler`,
        description: `${driver.firstName} ${driver.lastName}`,
        severity: driver.licenseExpiry && driver.licenseExpiry < now ? "High" : "Medium",
        timestamp: driver.licenseExpiry ? formatDateTime(driver.licenseExpiry) : "",
      })),
      ...buses.map((bus) => ({
        id: `bus-${bus.id}`,
        title: `Véhicule indisponible`,
        description: `${bus.plateNumber} · ${bus.status}`,
        severity: "High",
        timestamp: formatDateTime(now),
      })),
      ...insurance.map((bus) => ({
        id: `ins-${bus.id}`,
        title: `Assurance à renouveler`,
        description: `${bus.plateNumber}`,
        severity: "Medium",
        timestamp: bus.insuranceExpiry ? formatDateTime(bus.insuranceExpiry) : "",
      })),
    ];

    return alerts.slice(0, 6);
  },
};
