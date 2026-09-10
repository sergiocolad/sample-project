import { apiClient } from "./client";
import type { Stats } from "../types";

export function getStats() {
  return apiClient.get<Stats>("/stats").then((r) => r.data);
}
