import { Request, Response } from "express";
import { TripService } from "./trip.service";
import { logAction } from "../../utils/audit";

const parseDate = (value?: string) => (value ? new Date(value) : undefined);

export const TripController = {
  search: async (req: Request, res: Response) => {
    const trips = await TripService.search({
      origin: req.query.origin as string | undefined,
      destination: req.query.destination as string | undefined,
      date: req.query.date as string | undefined,
    });
    return res.json(trips);
  },

  get: async (req: Request, res: Response) => {
    const trip = await TripService.getById(req.params.id);
    if (!trip) return res.status(404).json({ message: "Trip not found" });
    return res.json(trip);
  },

  create: async (req: Request, res: Response) => {
    try {
      const trip = await TripService.create({
        ...req.body,
        departureTime: parseDate(req.body.departureTime) ?? new Date(),
        arrivalTime: parseDate(req.body.arrivalTime) ?? null,
      });
      await logAction(req, { tableName: "trip", action: "create", entityId: trip.id });
      return res.status(201).json(trip);
    } catch (error: any) {
      return res.status(400).json({ message: error.message ?? "Unable to create trip" });
    }
  },

  update: async (req: Request, res: Response) => {
    try {
      const trip = await TripService.update(req.params.id, {
        ...req.body,
        departureTime: parseDate(req.body.departureTime),
        arrivalTime: parseDate(req.body.arrivalTime),
      });
      await logAction(req, { tableName: "trip", action: "update", entityId: trip.id });
      return res.json(trip);
    } catch (error: any) {
      return res.status(400).json({ message: error.message ?? "Unable to update trip" });
    }
  },

  updateStatus: async (req: Request, res: Response) => {
    try {
      const trip = await TripService.updateStatus(req.params.id, req.body.status);
      await logAction(req, { tableName: "trip", action: "status", entityId: trip.id, description: req.body.status });
      return res.json(trip);
    } catch (error: any) {
      return res.status(400).json({ message: error.message ?? "Unable to update status" });
    }
  },

  byDriver: async (req: Request, res: Response) => {
    const trips = await TripService.listByDriver(req.params.driverId);
    return res.json(trips);
  },

  seats: async (req: Request, res: Response) => {
    try {
      const seats = await TripService.seats(req.params.id);
      return res.json(seats);
    } catch (error: any) {
      return res.status(400).json({ message: error.message ?? "Unable to load seats" });
    }
  },

  remove: async (req: Request, res: Response) => {
    try {
      const trip = await TripService.remove(req.params.id);
      await logAction(req, { tableName: "trip", action: "delete", entityId: trip.id });
      return res.json(trip);
    } catch (error: any) {
      return res.status(400).json({ message: error.message ?? "Unable to delete trip" });
    }
  },
};
