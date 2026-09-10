import type { Request, Response } from "express";
import * as statsService from "./stats.service.js";

export async function getStatsHandler(req: Request, res: Response) {
  const stats = await statsService.getStats(req.user!.id);
  res.status(200).json(stats);
}
