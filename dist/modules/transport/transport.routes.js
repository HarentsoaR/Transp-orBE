"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.transportRouter = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const bus_controller_1 = require("./bus.controller");
const driver_controller_1 = require("./driver.controller");
const route_controller_1 = require("./route.controller");
const trip_controller_1 = require("./trip.controller");
const reservation_controller_1 = require("./reservation.controller");
const traveler_controller_1 = require("./traveler.controller");
const validate_1 = require("../../middleware/validate");
const auth_1 = require("../../middleware/auth");
const permissions_1 = require("../../middleware/permissions");
exports.transportRouter = (0, express_1.Router)();
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
const busSchema = zod_1.z.object({
    plateNumber: zod_1.z.string().min(3),
    capacity: zod_1.z.number().int().positive(),
    comfortLevel: zod_1.z.string().optional(),
    status: zod_1.z.enum(["ACTIVE", "IN_SERVICE", "OUT_OF_SERVICE", "RETIRED"]).optional(),
});
const driverSchema = zod_1.z.object({
    firstName: zod_1.z.string(),
    lastName: zod_1.z.string(),
    phone: zod_1.z.string(),
    licenseNumber: zod_1.z.string(),
    status: zod_1.z.enum(["ACTIVE", "INACTIVE", "SUSPENDED"]).optional(),
    assignedBusId: zod_1.z.string().uuid().optional().nullable(),
});
const routeSchema = zod_1.z.object({
    origin: zod_1.z.string(),
    destination: zod_1.z.string(),
    distanceKm: zod_1.z.number().optional(),
    standardDurationMinutes: zod_1.z.number().int().optional(),
    basePrice: zod_1.z.number().positive(),
    isActive: zod_1.z.boolean().optional(),
});
const tripSchema = zod_1.z.object({
    routeId: zod_1.z.string().uuid(),
    busId: zod_1.z.string().uuid(),
    driverId: zod_1.z.string().uuid(),
    departureTime: zod_1.z.string(),
    arrivalTime: zod_1.z.string().optional(),
    price: zod_1.z.number().positive(),
    availableSeats: zod_1.z.number().int().positive().optional(),
    status: zod_1.z.enum(["SCHEDULED", "BOARDING", "DEPARTED", "ARRIVED", "CANCELLED"]).optional(),
    notes: zod_1.z.string().optional(),
});
const passengerSchema = zod_1.z.object({
    seatNumber: zod_1.z.number().int().positive().optional(),
    fullName: zod_1.z.string(),
    phone: zod_1.z.string(),
    email: zod_1.z.string().email().optional(),
    nationalId: zod_1.z.string().optional(),
    emergencyContactName: zod_1.z.string().optional(),
    emergencyContactPhone: zod_1.z.string().optional(),
    profession: zod_1.z.string().optional(),
});
const travelerSchema = zod_1.z.object({
    fullName: zod_1.z.string(),
    phone: zod_1.z.string(),
    email: zod_1.z.string().email().optional(),
    nationalId: zod_1.z.string().optional(),
    profession: zod_1.z.string().optional(),
    emergencyContactName: zod_1.z.string().optional(),
    emergencyContactPhone: zod_1.z.string().optional(),
});
const reservationSchema = zod_1.z
    .object({
    tripId: zod_1.z.string().uuid(),
    travelerId: zod_1.z.string().uuid().optional(),
    seatNumber: zod_1.z.number().int().positive().optional(),
    seatNumbers: zod_1.z.array(zod_1.z.number().int().positive()).optional(),
    price: zod_1.z.number().positive().optional(),
    travelerInfo: zod_1.z
        .object({
        fullName: zod_1.z.string(),
        phone: zod_1.z.string(),
        email: zod_1.z.string().email().optional(),
        nationalId: zod_1.z.string().optional(),
        emergencyContactName: zod_1.z.string().optional(),
        emergencyContactPhone: zod_1.z.string().optional(),
        profession: zod_1.z.string().optional(),
    })
        .optional(),
    passengers: zod_1.z.array(passengerSchema).optional(), // legacy
})
    .refine((data) => (data.seatNumbers && data.seatNumbers.length > 0) ||
    (!!data.seatNumber && !data.seatNumbers), { message: "Au moins un siège est requis" });
// Public endpoints: search + view
exports.transportRouter.get("/routes", route_controller_1.RouteController.list);
exports.transportRouter.get("/routes/:id", route_controller_1.RouteController.get);
exports.transportRouter.get("/trips", trip_controller_1.TripController.search);
exports.transportRouter.get("/trips/:id/seats", trip_controller_1.TripController.seats);
exports.transportRouter.get("/trips/:id", trip_controller_1.TripController.get);
exports.transportRouter.get("/admin/trips", auth_1.authenticate, (0, permissions_1.requirePermissions)([perms.tripView]), trip_controller_1.TripController.search);
// Traveler actions
exports.transportRouter.post("/reservations", auth_1.authenticate, (0, validate_1.validateBody)(reservationSchema), reservation_controller_1.ReservationController.create);
exports.transportRouter.get("/reservations/me", auth_1.authenticate, reservation_controller_1.ReservationController.myReservations);
exports.transportRouter.post("/reservations/:id/cancel", auth_1.authenticate, reservation_controller_1.ReservationController.cancel);
// Driver actions
exports.transportRouter.get("/drivers/:driverId/trips", auth_1.authenticate, trip_controller_1.TripController.byDriver);
exports.transportRouter.post("/reservations/:id/check-in", auth_1.authenticate, (0, permissions_1.requirePermissions)([perms.driverOps]), reservation_controller_1.ReservationController.checkIn);
// Backoffice/admin endpoints
exports.transportRouter.post("/admin/buses", auth_1.authenticate, (0, permissions_1.requirePermissions)([perms.busCreate]), (0, validate_1.validateBody)(busSchema), bus_controller_1.BusController.create);
exports.transportRouter.get("/admin/buses", auth_1.authenticate, (0, permissions_1.requirePermissions)([perms.busView]), bus_controller_1.BusController.list);
exports.transportRouter.patch("/admin/buses/:id", auth_1.authenticate, (0, permissions_1.requirePermissions)([perms.busUpdate]), (0, validate_1.validateBody)(busSchema.partial()), bus_controller_1.BusController.update);
exports.transportRouter.delete("/admin/buses/:id", auth_1.authenticate, (0, permissions_1.requirePermissions)([perms.busDelete]), bus_controller_1.BusController.remove);
exports.transportRouter.post("/admin/drivers", auth_1.authenticate, (0, permissions_1.requirePermissions)([perms.driverCreate]), (0, validate_1.validateBody)(driverSchema), driver_controller_1.DriverController.create);
exports.transportRouter.get("/admin/drivers", auth_1.authenticate, (0, permissions_1.requirePermissions)([perms.driverView]), driver_controller_1.DriverController.list);
exports.transportRouter.patch("/admin/drivers/:id", auth_1.authenticate, (0, permissions_1.requirePermissions)([perms.driverUpdate]), (0, validate_1.validateBody)(driverSchema.partial()), driver_controller_1.DriverController.update);
exports.transportRouter.delete("/admin/drivers/:id", auth_1.authenticate, (0, permissions_1.requirePermissions)([perms.driverDelete]), driver_controller_1.DriverController.remove);
exports.transportRouter.post("/admin/routes", auth_1.authenticate, (0, permissions_1.requirePermissions)([perms.routeCreate]), (0, validate_1.validateBody)(routeSchema), route_controller_1.RouteController.create);
exports.transportRouter.patch("/admin/routes/:id", auth_1.authenticate, (0, permissions_1.requirePermissions)([perms.routeUpdate]), (0, validate_1.validateBody)(routeSchema.partial()), route_controller_1.RouteController.update);
exports.transportRouter.delete("/admin/routes/:id", auth_1.authenticate, (0, permissions_1.requirePermissions)([perms.routeDelete]), route_controller_1.RouteController.remove);
exports.transportRouter.get("/admin/routes", auth_1.authenticate, (0, permissions_1.requirePermissions)([perms.routeView]), route_controller_1.RouteController.list);
exports.transportRouter.post("/admin/trips", auth_1.authenticate, (0, permissions_1.requirePermissions)([perms.tripCreate]), (0, validate_1.validateBody)(tripSchema), trip_controller_1.TripController.create);
exports.transportRouter.patch("/admin/trips/:id", auth_1.authenticate, (0, permissions_1.requirePermissions)([perms.tripUpdate]), (0, validate_1.validateBody)(tripSchema.partial()), trip_controller_1.TripController.update);
exports.transportRouter.delete("/admin/trips/:id", auth_1.authenticate, (0, permissions_1.requirePermissions)([perms.tripDelete]), trip_controller_1.TripController.remove);
exports.transportRouter.post("/admin/trips/:id/status", auth_1.authenticate, (0, permissions_1.requireAnyPermission)([perms.tripUpdate, perms.driverOps]), (0, validate_1.validateBody)(zod_1.z.object({ status: tripSchema.shape.status })), trip_controller_1.TripController.updateStatus);
exports.transportRouter.get("/admin/trips/:tripId/occupancy", auth_1.authenticate, (0, permissions_1.requirePermissions)([perms.manageReservations]), reservation_controller_1.ReservationController.occupancy);
exports.transportRouter.get("/admin/travelers", auth_1.authenticate, (0, permissions_1.requirePermissions)([perms.manageReservations]), traveler_controller_1.TravelerController.list);
exports.transportRouter.post("/admin/travelers", auth_1.authenticate, (0, permissions_1.requirePermissions)([perms.manageReservations]), (0, validate_1.validateBody)(travelerSchema), traveler_controller_1.TravelerController.create);
exports.transportRouter.patch("/admin/travelers/:id", auth_1.authenticate, (0, permissions_1.requirePermissions)([perms.manageReservations]), (0, validate_1.validateBody)(travelerSchema.partial()), traveler_controller_1.TravelerController.update);
exports.transportRouter.delete("/admin/travelers/:id", auth_1.authenticate, (0, permissions_1.requirePermissions)([perms.manageReservations]), traveler_controller_1.TravelerController.remove);
