import { PrismaClient, ShelfStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

interface SeedBook {
  openLibraryId: string;
  title: string;
  author: string;
  coverUrl: string;
  publishedYear: number;
  status: ShelfStatus;
  rating?: number;
  review?: string;
  totalPages?: number;
  currentPage?: number;
  startedAt?: Date;
  finishedAt?: Date;
}

async function main() {
  const passwordHash = await bcrypt.hash("password123", 12);

  const user = await prisma.user.upsert({
    where: { email: "demo@shelfie.dev" },
    update: {},
    create: {
      email: "demo@shelfie.dev",
      passwordHash,
      name: "Demo Reader",
    },
  });

  const books: SeedBook[] = [
    {
      openLibraryId: "OL27448W",
      title: "The Hobbit",
      author: "J.R.R. Tolkien",
      coverUrl: "https://covers.openlibrary.org/b/olid/OL27448W-M.jpg",
      publishedYear: 1937,
      status: ShelfStatus.READ,
      rating: 5,
      review: "A perfect adventure story. Reread every few years.",
      totalPages: 310,
      currentPage: 310,
      finishedAt: new Date("2026-02-14"),
    },
    {
      openLibraryId: "OL17930368W",
      title: "Project Hail Mary",
      author: "Andy Weir",
      coverUrl: "https://covers.openlibrary.org/b/olid/OL17930368W-M.jpg",
      publishedYear: 2021,
      status: ShelfStatus.READING,
      totalPages: 496,
      currentPage: 210,
      startedAt: new Date("2026-08-20"),
    },
    {
      openLibraryId: "OL1168083W",
      title: "Dune",
      author: "Frank Herbert",
      coverUrl: "https://covers.openlibrary.org/b/olid/OL1168083W-M.jpg",
      publishedYear: 1965,
      status: ShelfStatus.WANT_TO_READ,
    },
  ];

  for (const { status, rating, review, totalPages, currentPage, startedAt, finishedAt, ...bookData } of books) {
    const book = await prisma.book.upsert({
      where: { openLibraryId: bookData.openLibraryId },
      update: {},
      create: bookData,
    });

    await prisma.shelfEntry.upsert({
      where: { userId_bookId: { userId: user.id, bookId: book.id } },
      update: {},
      create: {
        userId: user.id,
        bookId: book.id,
        status,
        rating,
        review,
        totalPages,
        currentPage,
        startedAt,
        finishedAt,
      },
    });
  }

  console.log(`Seeded demo user: demo@shelfie.dev / password123`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
