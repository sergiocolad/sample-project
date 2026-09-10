import * as openLibrary from "./openLibrary.client.js";
import type { SearchQueryInput } from "./books.schema.js";

export async function search(input: SearchQueryInput) {
  const { results, total } = await openLibrary.searchBooks(input.q, input.page, input.limit);
  return {
    data: results,
    meta: { page: input.page, limit: input.limit, total },
  };
}

export function getByOpenLibraryId(openLibraryId: string) {
  return openLibrary.getBookByOpenLibraryId(openLibraryId);
}
