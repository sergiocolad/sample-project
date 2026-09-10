import request from "supertest";
import { describe, expect, it, vi } from "vitest";

// The Open Library client is mocked at the module boundary — CI never calls
// the real third-party API. See docs/04-engineering/TESTING_STRATEGY.md#backend.
vi.mock("../src/modules/books/openLibrary.client.js", () => ({
  searchBooks: vi.fn(),
  getBookByOpenLibraryId: vi.fn(),
}));

import { createApp } from "../src/app.js";
import * as openLibrary from "../src/modules/books/openLibrary.client.js";

const app = createApp();

async function authHeader() {
  const res = await request(app)
    .post("/api/auth/register")
    .send({ email: "search@example.com", password: "password123", name: "Searcher" });
  return `Bearer ${res.body.accessToken}`;
}

describe("GET /api/books/search", () => {
  it("returns normalized results (AC1)", async () => {
    vi.mocked(openLibrary.searchBooks).mockResolvedValue({
      results: [
        {
          openLibraryId: "OL27448W",
          title: "The Hobbit",
          author: "J.R.R. Tolkien",
          coverUrl: "https://covers.openlibrary.org/b/id/1-M.jpg",
          publishedYear: 1937,
        },
      ],
      total: 1,
    });

    const auth = await authHeader();
    const res = await request(app).get("/api/books/search?q=hobbit").set("Authorization", auth);

    expect(res.status).toBe(200);
    expect(res.body.data[0]).toMatchObject({ title: "The Hobbit", author: "J.R.R. Tolkien" });
    expect(res.body.meta.total).toBe(1);
  });

  it("returns 502 UPSTREAM_ERROR when Open Library fails (AC2)", async () => {
    const { ApiError } = await import("../src/utils/apiError.js");
    vi.mocked(openLibrary.searchBooks).mockRejectedValue(
      new ApiError("UPSTREAM_ERROR", "Open Library is unavailable"),
    );

    const auth = await authHeader();
    const res = await request(app).get("/api/books/search?q=hobbit").set("Authorization", auth);

    expect(res.status).toBe(502);
    expect(res.body.error.code).toBe("UPSTREAM_ERROR");
  });

  it("returns an empty array for no results, not an error (AC3)", async () => {
    vi.mocked(openLibrary.searchBooks).mockResolvedValue({ results: [], total: 0 });

    const auth = await authHeader();
    const res = await request(app)
      .get("/api/books/search?q=zzzzznonexistentzzzz")
      .set("Authorization", auth);

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
  });

  it("rejects a query shorter than 2 characters", async () => {
    const auth = await authHeader();
    const res = await request(app).get("/api/books/search?q=a").set("Authorization", auth);
    expect(res.status).toBe(422);
  });

  it("requires authentication", async () => {
    const res = await request(app).get("/api/books/search?q=hobbit");
    expect(res.status).toBe(401);
  });
});
