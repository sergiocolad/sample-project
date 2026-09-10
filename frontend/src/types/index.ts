export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: string;
}

export type ShelfStatus = "WANT_TO_READ" | "READING" | "READ";

export interface BookSummary {
  openLibraryId: string;
  title: string;
  author: string;
  coverUrl: string | null;
  publishedYear: number | null;
}

export interface ShelfEntry {
  id: string;
  status: ShelfStatus;
  currentPage: number | null;
  totalPages: number | null;
  rating: number | null;
  review: string | null;
  startedAt: string | null;
  finishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  book: BookSummary & { id: string };
}

export interface PageMeta {
  page: number;
  limit: number;
  total: number;
}

export interface Stats {
  booksReadThisYear: number;
  booksReadAllTime: number;
  pagesReadThisYear: number;
  currentlyReading: number;
  ratingDistribution: Record<"1" | "2" | "3" | "4" | "5", number>;
}

export interface ApiErrorBody {
  error: {
    code: string;
    message: string;
    details?: Array<{ field: string; issue: string }>;
  };
}
