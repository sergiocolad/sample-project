import { apiClient } from "./client";
import type { PageMeta, ShelfEntry, ShelfStatus } from "../types";

export function listShelf(status?: ShelfStatus) {
  return apiClient
    .get<{ data: ShelfEntry[]; meta: PageMeta }>("/shelf", { params: status ? { status } : {} })
    .then((r) => r.data);
}

export function addToShelf(input: { openLibraryId: string; status: ShelfStatus }) {
  return apiClient.post<ShelfEntry>("/shelf", input).then((r) => r.data);
}

export interface UpdateShelfEntryInput {
  status?: ShelfStatus;
  currentPage?: number;
  totalPages?: number;
  rating?: number;
  review?: string;
}

export function updateShelfEntry(id: string, input: UpdateShelfEntryInput) {
  return apiClient.patch<ShelfEntry>(`/shelf/${id}`, input).then((r) => r.data);
}

export function removeFromShelf(id: string) {
  return apiClient.delete(`/shelf/${id}`).then(() => undefined);
}
