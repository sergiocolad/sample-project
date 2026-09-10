import { z } from "zod";

export const shelfStatusSchema = z.enum(["WANT_TO_READ", "READING", "READ"]);

export const addToShelfSchema = z.object({
  openLibraryId: z.string().trim().min(1),
  status: shelfStatusSchema,
});
export type AddToShelfInput = z.infer<typeof addToShelfSchema>;

export const listShelfQuerySchema = z.object({
  status: shelfStatusSchema.optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
export type ListShelfQueryInput = z.infer<typeof listShelfQuerySchema>;

export const updateShelfEntrySchema = z
  .object({
    status: shelfStatusSchema.optional(),
    currentPage: z.number().int().min(0).optional(),
    totalPages: z.number().int().min(1).optional(),
    rating: z.number().int().min(1).max(5).optional(),
    review: z.string().max(2000).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
  });
export type UpdateShelfEntryInput = z.infer<typeof updateShelfEntrySchema>;
