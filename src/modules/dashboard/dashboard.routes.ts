import { Router } from "express";
import { DashboardService } from "./dashboard.service";

export const dashboardRouter = Router();

dashboardRouter.get("/kpis", async (_req, res) => {
  try {
    const data = await DashboardService.kpis();
    return res.json(data);
  } catch (error: any) {
    return res.status(500).json({ message: error.message ?? "Unable to load KPIs", code: "DASHBOARD_KPIS_FAILED" });
  }
});

dashboardRouter.get("/action-queue", async (_req, res) => {
  try {
    const data = await DashboardService.actionQueue();
    return res.json(data);
  } catch (error: any) {
    return res
      .status(500)
      .json({ message: error.message ?? "Unable to load action queue", code: "DASHBOARD_QUEUE_FAILED" });
  }
});

dashboardRouter.get("/today-trips", async (_req, res) => {
  try {
    const data = await DashboardService.todayTrips();
    return res.json(data);
  } catch (error: any) {
    return res
      .status(500)
      .json({ message: error.message ?? "Unable to load trips", code: "DASHBOARD_TRIPS_FAILED" });
  }
});

dashboardRouter.get("/activity", async (_req, res) => {
  try {
    const data = await DashboardService.activity();
    return res.json(data);
  } catch (error: any) {
    return res
      .status(500)
      .json({ message: error.message ?? "Unable to load activity", code: "DASHBOARD_ACTIVITY_FAILED" });
  }
});

dashboardRouter.get("/alerts", async (_req, res) => {
  try {
    const data = await DashboardService.alerts();
    return res.json(data);
  } catch (error: any) {
    return res
      .status(500)
      .json({ message: error.message ?? "Unable to load alerts", code: "DASHBOARD_ALERTS_FAILED" });
  }
});
