import { Request, Response } from "express";
import { ReservationService } from "./reservation.service";

export const ReservationController = {
  create: async (req: Request, res: Response) => {
    try {
      const reservation = await ReservationService.create(req.body, req.user?.id);
      return res.status(201).json(reservation);
    } catch (error: any) {
      return res.status(400).json({ message: error.message ?? "Unable to create reservation" });
    }
  },

  myReservations: async (req: Request, res: Response) => {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });
    const reservations = await ReservationService.listForTraveler(req.user.id);
    return res.json(reservations);
  },

  cancel: async (req: Request, res: Response) => {
    try {
      const reservation = await ReservationService.cancel(req.params.id, req.user?.id);
      return res.json(reservation);
    } catch (error: any) {
      return res.status(400).json({ message: error.message ?? "Unable to cancel reservation" });
    }
  },

  checkIn: async (req: Request, res: Response) => {
    try {
      const reservation = await ReservationService.checkIn(req.params.id);
      return res.json(reservation);
    } catch (error: any) {
      return res.status(400).json({ message: error.message ?? "Unable to check in reservation" });
    }
  },

  occupancy: async (req: Request, res: Response) => {
    const data = await ReservationService.occupancy(req.params.tripId);
    return res.json(data);
  },
};
