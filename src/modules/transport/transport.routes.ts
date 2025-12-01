import { Router } from "express";
import { z } from "zod";
import { BusController } from "./bus.controller";
import { DriverController } from "./driver.controller";
import { RouteController } from "./route.controller";
import { TripController } from "./trip.controller";
import { ReservationController } from "./reservation.controller";
import { TravelerController } from "./traveler.controller";
import { validateBody } from "../../middleware/validate";
import { authenticate } from "../../middleware/auth";
import { requireAnyPermission, requirePermissions } from "../../middleware/permissions";

export const transportRouter = Router();

const perms = {
  busView: "transport.buses.view",
  busCreate: "transport.buses.create",
  busUpdate: "transport.buses.update",
  busDelete: "transport.buses.delete",
  driverView: "transport.drivers.view",
  driverCreate: "transport.drivers.create",
  driverUpdate: "transport.drivers.update",
  driverDelete: "transport.drivers.delete",
  routeView: "transport.routes.view",
  routeCreate: "transport.routes.create",
  routeUpdate: "transport.routes.update",
  routeDelete: "transport.routes.delete",
  tripView: "transport.trips.view",
  tripCreate: "transport.trips.create",
  tripUpdate: "transport.trips.update",
  tripDelete: "transport.trips.delete",
  manageReservations: "transport.reservations.manage",
  driverOps: "driver.operations",
};

const busSchema = z.object({
  plateNumber: z.string().min(3),
  capacity: z.number().int().positive(),
  comfortLevel: z.string().optional(),
  status: z.enum(["ACTIVE", "IN_SERVICE", "OUT_OF_SERVICE", "RETIRED"]).optional(),
});

const driverSchema = z.object({
  firstName: z.string(),
  lastName: z.string(),
  phone: z.string(),
  licenseNumber: z.string(),
  status: z.enum(["ACTIVE", "INACTIVE", "SUSPENDED"]).optional(),
  assignedBusId: z.string().uuid().optional().nullable(),
});

const routeSchema = z.object({
  origin: z.string(),
  destination: z.string(),
  distanceKm: z.number().optional(),
  standardDurationMinutes: z.number().int().optional(),
  basePrice: z.number().positive(),
  isActive: z.boolean().optional(),
});

const tripSchema = z.object({
  routeId: z.string().uuid(),
  busId: z.string().uuid(),
  driverId: z.string().uuid(),
  departureTime: z.string(),
  arrivalTime: z.string().optional(),
  price: z.number().positive(),
  availableSeats: z.number().int().positive().optional(),
  status: z.enum(["SCHEDULED", "BOARDING", "DEPARTED", "ARRIVED", "CANCELLED"]).optional(),
  notes: z.string().optional(),
});

const passengerSchema = z.object({
  seatNumber: z.number().int().positive().optional(),
  fullName: z.string(),
  phone: z.string(),
  email: z.string().email().optional(),
  nationalId: z.string().optional(),
  emergencyContactName: z.string().optional(),
  emergencyContactPhone: z.string().optional(),
  profession: z.string().optional(),
});

const travelerSchema = z.object({
  fullName: z.string(),
  phone: z.string(),
  email: z.string().email().optional(),
  nationalId: z.string().optional(),
  profession: z.string().optional(),
  emergencyContactName: z.string().optional(),
  emergencyContactPhone: z.string().optional(),
});

const reservationSchema = z
  .object({
    tripId: z.string().uuid(),
    travelerId: z.string().uuid().optional(),
    seatNumber: z.number().int().positive().optional(),
    seatNumbers: z.array(z.number().int().positive()).optional(),
    price: z.number().positive().optional(),
    travelerInfo: z
      .object({
        fullName: z.string(),
        phone: z.string(),
        email: z.string().email().optional(),
        nationalId: z.string().optional(),
        emergencyContactName: z.string().optional(),
        emergencyContactPhone: z.string().optional(),
        profession: z.string().optional(),
      })
      .optional(),
    passengers: z.array(passengerSchema).optional(), // legacy
  })
  .refine(
    (data) =>
      (data.seatNumbers && data.seatNumbers.length > 0) ||
      (!!data.seatNumber && !data.seatNumbers),
    { message: "Au moins un siège est requis" }
  );

// Public endpoints: search + view
transportRouter.get("/routes", RouteController.list);
transportRouter.get("/routes/:id", RouteController.get);
transportRouter.get("/trips", TripController.search);
transportRouter.get("/trips/:id/seats", TripController.seats);
transportRouter.get("/trips/:id", TripController.get);
transportRouter.get(
  "/admin/trips",
  authenticate,
  requirePermissions([perms.tripView]),
  TripController.search
);

// Traveler actions
transportRouter.post("/reservations", authenticate, validateBody(reservationSchema), ReservationController.create);
transportRouter.get("/reservations/me", authenticate, ReservationController.myReservations);
transportRouter.post("/reservations/:id/cancel", authenticate, ReservationController.cancel);

// Driver actions
transportRouter.get("/drivers/:driverId/trips", authenticate, TripController.byDriver);
transportRouter.post(
  "/reservations/:id/check-in",
  authenticate,
  requirePermissions([perms.driverOps]),
  ReservationController.checkIn
);

// Backoffice/admin endpoints
transportRouter.post(
  "/admin/buses",
  authenticate,
  requirePermissions([perms.busCreate]),
  validateBody(busSchema),
  BusController.create
);
transportRouter.get("/admin/buses", authenticate, requirePermissions([perms.busView]), BusController.list);
transportRouter.patch(
  "/admin/buses/:id",
  authenticate,
  requirePermissions([perms.busUpdate]),
  validateBody(busSchema.partial()),
  BusController.update
);
transportRouter.delete(
  "/admin/buses/:id",
  authenticate,
  requirePermissions([perms.busDelete]),
  BusController.remove
);

transportRouter.post(
  "/admin/drivers",
  authenticate,
  requirePermissions([perms.driverCreate]),
  validateBody(driverSchema),
  DriverController.create
);
transportRouter.get("/admin/drivers", authenticate, requirePermissions([perms.driverView]), DriverController.list);
transportRouter.patch(
  "/admin/drivers/:id",
  authenticate,
  requirePermissions([perms.driverUpdate]),
  validateBody(driverSchema.partial()),
  DriverController.update
);
transportRouter.delete(
  "/admin/drivers/:id",
  authenticate,
  requirePermissions([perms.driverDelete]),
  DriverController.remove
);

transportRouter.post(
  "/admin/routes",
  authenticate,
  requirePermissions([perms.routeCreate]),
  validateBody(routeSchema),
  RouteController.create
);
transportRouter.patch(
  "/admin/routes/:id",
  authenticate,
  requirePermissions([perms.routeUpdate]),
  validateBody(routeSchema.partial()),
  RouteController.update
);
transportRouter.delete(
  "/admin/routes/:id",
  authenticate,
  requirePermissions([perms.routeDelete]),
  RouteController.remove
);
transportRouter.get(
  "/admin/routes",
  authenticate,
  requirePermissions([perms.routeView]),
  RouteController.list
);

transportRouter.post(
  "/admin/trips",
  authenticate,
  requirePermissions([perms.tripCreate]),
  validateBody(tripSchema),
  TripController.create
);
transportRouter.patch(
  "/admin/trips/:id",
  authenticate,
  requirePermissions([perms.tripUpdate]),
  validateBody(tripSchema.partial()),
  TripController.update
);
transportRouter.delete(
  "/admin/trips/:id",
  authenticate,
  requirePermissions([perms.tripDelete]),
  TripController.remove
);
transportRouter.post(
  "/admin/trips/:id/status",
  authenticate,
  requireAnyPermission([perms.tripUpdate, perms.driverOps]),
  validateBody(z.object({ status: tripSchema.shape.status })),
  TripController.updateStatus
);
transportRouter.get(
  "/admin/trips/:tripId/occupancy",
  authenticate,
  requirePermissions([perms.manageReservations]),
  ReservationController.occupancy
);

transportRouter.get(
  "/admin/travelers",
  authenticate,
  requirePermissions([perms.manageReservations]),
  TravelerController.list
);
transportRouter.post(
  "/admin/travelers",
  authenticate,
  requirePermissions([perms.manageReservations]),
  validateBody(travelerSchema),
  TravelerController.create
);
transportRouter.patch(
  "/admin/travelers/:id",
  authenticate,
  requirePermissions([perms.manageReservations]),
  validateBody(travelerSchema.partial()),
  TravelerController.update
);
transportRouter.delete(
  "/admin/travelers/:id",
  authenticate,
  requirePermissions([perms.manageReservations]),
  TravelerController.remove
);
