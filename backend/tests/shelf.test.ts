import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../src/modules/books/openLibrary.client.js", () => ({
  searchBooks: vi.fn(),
  getBookByOpenLibraryId: vi.fn(),
}));

import { createApp } from "../src/app.js";
import * as openLibrary from "../src/modules/books/openLibrary.client.js";

const app = createApp();

const DUNE = {
  openLibraryId: "OL1168083W",
  title: "Dune",
  author: "Frank Herbert",
  coverUrl: null,
  publishedYear: 1965,
};

async function registerAndGetToken(email: string) {
  const res = await request(app)
    .post("/api/auth/register")
    .send({ email, password: "password123", name: "Reader" });
  return res.body.accessToken as string;
}

beforeEach(() => {
  vi.mocked(openLibrary.getBookByOpenLibraryId).mockResolvedValue(DUNE);
});

describe("POST /api/shelf", () => {
  it("caches the book and creates a shelf entry on first add (AC1)", async () => {
    const token = await registerAndGetToken("shelf1@example.com");

    const res = await request(app)
      .post("/api/shelf")
      .set("Authorization", `Bearer ${token}`)
      .send({ openLibraryId: DUNE.openLibraryId, status: "WANT_TO_READ" });

    expect(res.status).toBe(201);
    expect(res.body.status).toBe("WANT_TO_READ");
    expect(res.body.book.title).toBe("Dune");
    expect(openLibrary.getBookByOpenLibraryId).toHaveBeenCalledTimes(1);
  });

  it("updates the existing entry in place instead of duplicating (AC2)", async () => {
    const token = await registerAndGetToken("shelf2@example.com");
    const auth = `Bearer ${token}`;

    const first = await request(app)
      .post("/api/shelf")
      .set("Authorization", auth)
      .send({ openLibraryId: DUNE.openLibraryId, status: "WANT_TO_READ" });
    const second = await request(app)
      .post("/api/shelf")
      .set("Authorization", auth)
      .send({ openLibraryId: DUNE.openLibraryId, status: "READING" });

    expect(first.status).toBe(201);
    expect(second.status).toBe(200);
    expect(second.body.id).toBe(first.body.id);
    expect(second.body.status).toBe("READING");

    const list = await request(app).get("/api/shelf").set("Authorization", auth);
    expect(list.body.data).toHaveLength(1);
  });
});

describe("PATCH /api/shelf/:id", () => {
  it("returns 404 for an entry owned by another user (AC3)", async () => {
    const ownerToken = await registerAndGetToken("owner@example.com");
    const intruderToken = await registerAndGetToken("intruder@example.com");

    const created = await request(app)
      .post("/api/shelf")
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({ openLibraryId: DUNE.openLibraryId, status: "READING" });

    const res = await request(app)
      .patch(`/api/shelf/${created.body.id}`)
      .set("Authorization", `Bearer ${intruderToken}`)
      .send({ currentPage: 50 });

    expect(res.status).toBe(404);
  });

  it("rejects setting currentPage while WANT_TO_READ (AC4)", async () => {
    const token = await registerAndGetToken("progress@example.com");
    const auth = `Bearer ${token}`;

    const created = await request(app)
      .post("/api/shelf")
      .set("Authorization", auth)
      .send({ openLibraryId: DUNE.openLibraryId, status: "WANT_TO_READ" });

    const res = await request(app)
      .patch(`/api/shelf/${created.body.id}`)
      .set("Authorization", auth)
      .send({ currentPage: 10 });

    expect(res.status).toBe(422);
  });

  it("sets finishedAt automatically when status moves to READ (AC5)", async () => {
    const token = await registerAndGetToken("finisher@example.com");
    const auth = `Bearer ${token}`;

    const created = await request(app)
      .post("/api/shelf")
      .set("Authorization", auth)
      .send({ openLibraryId: DUNE.openLibraryId, status: "READING" });

    const res = await request(app)
      .patch(`/api/shelf/${created.body.id}`)
      .set("Authorization", auth)
      .send({ status: "READ" });

    expect(res.status).toBe(200);
    expect(res.body.finishedAt).not.toBeNull();
  });

  it("rejects a rating outside 1-5", async () => {
    const token = await registerAndGetToken("rater@example.com");
    const auth = `Bearer ${token}`;

    const created = await request(app)
      .post("/api/shelf")
      .set("Authorization", auth)
      .send({ openLibraryId: DUNE.openLibraryId, status: "READ" });

    const res = await request(app)
      .patch(`/api/shelf/${created.body.id}`)
      .set("Authorization", auth)
      .send({ rating: 7 });

    expect(res.status).toBe(422);
  });
});

describe("DELETE /api/shelf/:id", () => {
  it("removes the entry", async () => {
    const token = await registerAndGetToken("remover@example.com");
    const auth = `Bearer ${token}`;

    const created = await request(app)
      .post("/api/shelf")
      .set("Authorization", auth)
      .send({ openLibraryId: DUNE.openLibraryId, status: "WANT_TO_READ" });

    const del = await request(app).delete(`/api/shelf/${created.body.id}`).set("Authorization", auth);
    expect(del.status).toBe(204);

    const list = await request(app).get("/api/shelf").set("Authorization", auth);
    expect(list.body.data).toHaveLength(0);
  });

  it("returns 404 deleting a non-existent entry", async () => {
    const token = await registerAndGetToken("nodelete@example.com");
    const res = await request(app)
      .delete("/api/shelf/00000000-0000-0000-0000-000000000000")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(404);
  });
});

describe("shelf routes require auth", () => {
  it("rejects requests without a token before any business logic runs", async () => {
    const res = await request(app).get("/api/shelf");
    expect(res.status).toBe(401);
  });
});
