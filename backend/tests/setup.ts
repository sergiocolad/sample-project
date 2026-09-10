import { afterAll, beforeEach } from "vitest";
import { prisma } from "../src/lib/prisma.js";

// Truncate in FK-safe order before every test so each test starts from a
// clean slate without paying for a full migrate reset per test — see
// docs/04-engineering/TESTING_STRATEGY.md#backend.
beforeEach(async () => {
  await prisma.shelfEntry.deleteMany();
  await prisma.book.deleteMany();
  await prisma.user.deleteMany();
});

afterAll(async () => {
  await prisma.$disconnect();
});
