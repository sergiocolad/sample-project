import { apiClient } from "./client";
import type { User } from "../types";

export interface AuthResponse {
  user: User;
  accessToken: string;
}

export function register(input: { email: string; password: string; name: string }) {
  return apiClient.post<AuthResponse>("/auth/register", input).then((r) => r.data);
}

export function login(input: { email: string; password: string }) {
  return apiClient.post<AuthResponse>("/auth/login", input).then((r) => r.data);
}

export function logout() {
  return apiClient.post("/auth/logout").then(() => undefined);
}

export function getCurrentUser() {
  return apiClient.get<User>("/auth/me").then((r) => r.data);
}
