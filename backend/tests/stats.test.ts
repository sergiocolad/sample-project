import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../src/modules/books/openLibrary.client.js", () => ({
  searchBooks: vi.fn(),
  getBookByOpenLibraryId: vi.fn(),
}));

import { createApp } from "../src/app.js";
import * as openLibrary from "../src/modules/books/openLibrary.client.js";

const app = createApp();

async function registerAndGetToken(email: string) {
  const res = await request(app)
    .post("/api/auth/register")
    .send({ email, password: "password123", name: "Reader" });
  return res.body.accessToken as string;
}

beforeEach(() => {
  vi.mocked(openLibrary.getBookByOpenLibraryId).mockImplementation(async (id: string) => ({
    openLibraryId: id,
    title: `Book ${id}`,
    author: "Some Author",
    coverUrl: null,
    publishedYear: 2000,
  }));
});

describe("GET /api/stats", () => {
  it("returns all-zero stats for a user with no shelf entries (AC3)", async () => {
    const token = await registerAndGetToken("empty@example.com");
    const res = await request(app).get("/api/stats").set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      booksReadThisYear: 0,
      booksReadAllTime: 0,
      pagesReadThisYear: 0,
      currentlyReading: 0,
      ratingDistribution: { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0 },
    });
  });

  it("zero-fills every rating key even when only some ratings occur (AC2)", async () => {
    const token = await registerAndGetToken("rater@example.com");
    const auth = `Bearer ${token}`;

    await request(app)
      .post("/api/shelf")
      .set("Authorization", auth)
      .send({ openLibraryId: "OL1", status: "READ" });

    const list = await request(app).get("/api/shelf").set("Authorization", auth);
    await request(app)
      .patch(`/api/shelf/${list.body.data[0].id}`)
      .set("Authorization", auth)
      .send({ rating: 4 });

    const res = await request(app).get("/api/stats").set("Authorization", auth);

    expect(Object.keys(res.body.ratingDistribution).sort()).toEqual(["1", "2", "3", "4", "5"]);
    expect(res.body.ratingDistribution["4"]).toBe(1);
  });

  it("counts READING entries as currentlyReading, not as read", async () => {
    const token = await registerAndGetToken("reading@example.com");
    const auth = `Bearer ${token}`;

    await request(app)
      .post("/api/shelf")
      .set("Authorization", auth)
      .send({ openLibraryId: "OL2", status: "READING" });

    const res = await request(app).get("/api/stats").set("Authorization", auth);

    expect(res.body.currentlyReading).toBe(1);
    expect(res.body.booksReadAllTime).toBe(0);
  });

  it("requires authentication", async () => {
    const res = await request(app).get("/api/stats");
    expect(res.status).toBe(401);
  });
});
