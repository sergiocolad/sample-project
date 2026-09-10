import { prisma } from "../../lib/prisma.js";

// Aggregation logic is isolated here (rather than inline in the controller)
// specifically because it's non-trivial enough to warrant a focused unit
// test independent of the HTTP layer — see
// docs/04-engineering/TESTING_STRATEGY.md#backend.

export interface Stats {
  booksReadThisYear: number;
  booksReadAllTime: number;
  pagesReadThisYear: number;
  currentlyReading: number;
  ratingDistribution: Record<"1" | "2" | "3" | "4" | "5", number>;
}

export async function getStats(userId: string): Promise<Stats> {
  const now = new Date();
  const yearStart = new Date(Date.UTC(now.getUTCFullYear(), 0, 1));
  const yearEnd = new Date(Date.UTC(now.getUTCFullYear() + 1, 0, 1));

  const [readEntries, currentlyReading] = await Promise.all([
    prisma.shelfEntry.findMany({
      where: { userId, status: "READ" },
      select: { finishedAt: true, totalPages: true, rating: true },
    }),
    prisma.shelfEntry.count({ where: { userId, status: "READING" } }),
  ]);

  const ratingDistribution: Stats["ratingDistribution"] = { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0 };
  let booksReadThisYear = 0;
  let pagesReadThisYear = 0;

  for (const entry of readEntries) {
    const finishedInCurrentYear =
      entry.finishedAt !== null && entry.finishedAt >= yearStart && entry.finishedAt < yearEnd;

    if (finishedInCurrentYear) {
      booksReadThisYear += 1;
      pagesReadThisYear += entry.totalPages ?? 0;
    }

    if (entry.rating) {
      const key = String(entry.rating) as keyof Stats["ratingDistribution"];
      ratingDistribution[key] += 1;
    }
  }

  return {
    booksReadThisYear,
    booksReadAllTime: readEntries.length,
    pagesReadThisYear,
    currentlyReading,
    ratingDistribution,
  };
}
