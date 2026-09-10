import { env } from "../../config/env.js";
import { ApiError } from "../../utils/apiError.js";

// The only file in this codebase that talks to Open Library. All calls to
// the third party are isolated here so callers (books.service.ts) work with
// our own normalized shape and never see Open Library's response format
// directly — see docs/02-architecture/adr/0004-openlibrary-integration.md.

export interface NormalizedBook {
  openLibraryId: string;
  title: string;
  author: string;
  coverUrl: string | null;
  publishedYear: number | null;
}

interface OpenLibrarySearchDoc {
  key: string; // "/works/OL27448W"
  title: string;
  author_name?: string[];
  cover_i?: number;
  first_publish_year?: number;
}

interface OpenLibrarySearchResponse {
  numFound: number;
  docs: OpenLibrarySearchDoc[];
}

interface OpenLibraryWorkResponse {
  key: string;
  title: string;
  covers?: number[];
  first_publish_date?: string;
  authors?: Array<{ author: { key: string } }>;
}

function coverUrlFromId(coverId: number | undefined): string | null {
  return coverId ? `https://covers.openlibrary.org/b/id/${coverId}-M.jpg` : null;
}

function workKeyToId(key: string): string {
  // "/works/OL27448W" -> "OL27448W"
  return key.split("/").pop() ?? key;
}

async function fetchWithTimeout(url: string): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), env.OPEN_LIBRARY_TIMEOUT_MS);

  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) {
      throw new ApiError("UPSTREAM_ERROR", `Open Library responded with ${response.status}`);
    }
    return response;
  } catch (err) {
    if (err instanceof ApiError) throw err;
    throw new ApiError("UPSTREAM_ERROR", "Open Library is unavailable");
  } finally {
    clearTimeout(timeout);
  }
}

export async function searchBooks(
  query: string,
  page: number,
  limit: number,
): Promise<{ results: NormalizedBook[]; total: number }> {
  const offset = (page - 1) * limit;
  const url = `${env.OPEN_LIBRARY_BASE_URL}/search.json?q=${encodeURIComponent(query)}&offset=${offset}&limit=${limit}`;

  const response = await fetchWithTimeout(url);
  const data = (await response.json()) as OpenLibrarySearchResponse;

  const results: NormalizedBook[] = data.docs.map((doc) => ({
    openLibraryId: workKeyToId(doc.key),
    title: doc.title,
    author: doc.author_name?.[0] ?? "Unknown author",
    coverUrl: coverUrlFromId(doc.cover_i),
    publishedYear: doc.first_publish_year ?? null,
  }));

  return { results, total: data.numFound };
}

export async function getBookByOpenLibraryId(openLibraryId: string): Promise<NormalizedBook> {
  const url = `${env.OPEN_LIBRARY_BASE_URL}/works/${openLibraryId}.json`;

  let response: Response;
  try {
    response = await fetchWithTimeout(url);
  } catch (err) {
    if (err instanceof ApiError && err.code === "UPSTREAM_ERROR") throw err;
    throw new ApiError("NOT_FOUND", `No book found for id ${openLibraryId}`);
  }

  const data = (await response.json()) as OpenLibraryWorkResponse;
  const publishedYear = data.first_publish_date
    ? Number.parseInt(data.first_publish_date.slice(-4), 10)
    : null;

  return {
    openLibraryId: workKeyToId(data.key),
    title: data.title,
    author: "Unknown author", // Work-level payload doesn't include resolved author names without a second call; acceptable for detail view scope.
    coverUrl: coverUrlFromId(data.covers?.[0]),
    publishedYear: Number.isNaN(publishedYear) ? null : publishedYear,
  };
}
