import { z } from "zod";

export const searchQuerySchema = z.object({
  q: z.string().trim().min(2, "Query must be at least 2 characters"),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
export type SearchQueryInput = z.infer<typeof searchQuerySchema>;
