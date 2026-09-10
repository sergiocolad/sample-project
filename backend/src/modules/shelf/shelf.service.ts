import type { ShelfStatus } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import { ApiError } from "../../utils/apiError.js";
import * as booksService from "../books/books.service.js";
import type { AddToShelfInput, ListShelfQueryInput, UpdateShelfEntryInput } from "./shelf.schema.js";

// Every query here is scoped by userId — this is the single invariant that
// keeps one user's shelf private from another (see
// docs/04-engineering/SECURITY.md#authorization and SPEC-003 AC3).

async function getOrCacheBook(openLibraryId: string) {
  const existing = await prisma.book.findUnique({ where: { openLibraryId } });
  if (existing) return existing;

  const fresh = await booksService.getByOpenLibraryId(openLibraryId);
  return prisma.book.create({
    data: {
      openLibraryId: fresh.openLibraryId,
      title: fresh.title,
      author: fresh.author,
      coverUrl: fresh.coverUrl,
      publishedYear: fresh.publishedYear,
    },
  });
}

export async function addToShelf(userId: string, input: AddToShelfInput) {
  const book = await getOrCacheBook(input.openLibraryId);

  const existingEntry = await prisma.shelfEntry.findUnique({
    where: { userId_bookId: { userId, bookId: book.id } },
  });

  const finishedAt = input.status === "READ" ? new Date() : undefined;
  const startedAt = input.status === "READING" ? new Date() : undefined;

  const entry = await prisma.shelfEntry.upsert({
    where: { userId_bookId: { userId, bookId: book.id } },
    create: { userId, bookId: book.id, status: input.status, startedAt, finishedAt },
    update: { status: input.status, ...(finishedAt && { finishedAt }), ...(startedAt && { startedAt }) },
    include: { book: true },
  });

  return { entry, wasCreated: !existingEntry };
}

export async function listShelf(userId: string, query: ListShelfQueryInput) {
  const where = { userId, ...(query.status && { status: query.status as ShelfStatus }) };

  const [entries, total] = await Promise.all([
    prisma.shelfEntry.findMany({
      where,
      include: { book: true },
      orderBy: { updatedAt: "desc" },
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    }),
    prisma.shelfEntry.count({ where }),
  ]);

  return { data: entries, meta: { page: query.page, limit: query.limit, total } };
}

async function getOwnedEntry(userId: string, id: string) {
  const entry = await prisma.shelfEntry.findUnique({ where: { id }, include: { book: true } });
  // 404 (not 403) for another user's entry — we don't confirm existence to
  // an unauthorized caller. See docs/02-architecture/API_DESIGN.md#resource-ownership.
  if (!entry || entry.userId !== userId) {
    throw new ApiError("NOT_FOUND", "Shelf entry not found");
  }
  return entry;
}

export async function updateShelfEntry(userId: string, id: string, input: UpdateShelfEntryInput) {
  const existing = await getOwnedEntry(userId, id);

  const nextStatus = input.status ?? existing.status;
  if (input.currentPage !== undefined && nextStatus === "WANT_TO_READ") {
    throw new ApiError(
      "VALIDATION_ERROR",
      "Cannot set currentPage while status is WANT_TO_READ",
      [{ field: "currentPage", issue: "Book must be Reading or Read to track progress" }],
    );
  }

  const totalPages = input.totalPages ?? existing.totalPages ?? undefined;
  if (input.currentPage !== undefined && totalPages !== undefined && input.currentPage > totalPages) {
    throw new ApiError("VALIDATION_ERROR", "currentPage cannot exceed totalPages", [
      { field: "currentPage", issue: "Must not exceed totalPages" },
    ]);
  }

  const finishedAt =
    input.status === "READ" && !existing.finishedAt ? new Date() : undefined;
  const startedAt =
    input.status === "READING" && !existing.startedAt ? new Date() : undefined;

  return prisma.shelfEntry.update({
    where: { id },
    data: { ...input, ...(finishedAt && { finishedAt }), ...(startedAt && { startedAt }) },
    include: { book: true },
  });
}

export async function removeFromShelf(userId: string, id: string) {
  await getOwnedEntry(userId, id);
  await prisma.shelfEntry.delete({ where: { id } });
}
