import { apiClient } from "./client";
import type { BookSummary, PageMeta } from "../types";

export function searchBooks(query: string) {
  return apiClient
    .get<{ data: BookSummary[]; meta: PageMeta }>("/books/search", { params: { q: query } })
    .then((r) => r.data);
}
