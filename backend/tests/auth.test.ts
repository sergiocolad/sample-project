import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "../src/app.js";

const app = createApp();

const credentials = { email: "reader@example.com", password: "password123", name: "Reader" };

describe("POST /api/auth/register", () => {
  it("creates an account and never returns the password (AC1)", async () => {
    const res = await request(app).post("/api/auth/register").send(credentials);

    expect(res.status).toBe(201);
    expect(res.body.accessToken).toBeTypeOf("string");
    expect(res.body.user.email).toBe(credentials.email);
    expect(res.body.user).not.toHaveProperty("password");
    expect(res.body.user).not.toHaveProperty("passwordHash");
  });

  it("rejects a duplicate email with 409 (AC2)", async () => {
    await request(app).post("/api/auth/register").send(credentials);
    const res = await request(app).post("/api/auth/register").send(credentials);

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe("CONFLICT");
  });

  it("rejects a password shorter than 8 characters", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ ...credentials, password: "short" });

    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });
});

describe("POST /api/auth/login", () => {
  it("logs in with valid credentials and sets a secure refresh cookie (AC3)", async () => {
    await request(app).post("/api/auth/register").send(credentials);

    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: credentials.email, password: credentials.password });

    expect(res.status).toBe(200);
    expect(res.body.accessToken).toBeTypeOf("string");

    const cookie = res.headers["set-cookie"]?.[0] ?? "";
    expect(cookie).toMatch(/HttpOnly/i);
    expect(cookie).toMatch(/SameSite=Strict/i);
  });

  it("returns an identical generic 401 for wrong password and unknown email (AC4)", async () => {
    await request(app).post("/api/auth/register").send(credentials);

    const wrongPassword = await request(app)
      .post("/api/auth/login")
      .send({ email: credentials.email, password: "wrongpassword" });
    const unknownEmail = await request(app)
      .post("/api/auth/login")
      .send({ email: "nobody@example.com", password: credentials.password });

    expect(wrongPassword.status).toBe(401);
    expect(unknownEmail.status).toBe(401);
    expect(wrongPassword.body.error.message).toBe(unknownEmail.body.error.message);
  });
});

describe("GET /api/auth/me", () => {
  it("returns 401 without a token (AC5)", async () => {
    const res = await request(app).get("/api/auth/me");
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("UNAUTHORIZED");
  });

  it("returns the current user with a valid token", async () => {
    const registerRes = await request(app).post("/api/auth/register").send(credentials);
    const token = registerRes.body.accessToken;

    const res = await request(app).get("/api/auth/me").set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.email).toBe(credentials.email);
  });
});
