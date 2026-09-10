import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

const loginMock = vi.fn();

vi.mock("../context/AuthContext", () => ({
  useAuth: () => ({ login: loginMock, register: vi.fn(), logout: vi.fn(), user: null, isLoading: false }),
}));

import { LoginPage } from "./LoginPage";

beforeEach(() => {
  loginMock.mockReset();
});

function renderLoginPage() {
  return render(
    <MemoryRouter>
      <LoginPage />
    </MemoryRouter>,
  );
}

describe("LoginPage", () => {
  it("calls login with the entered credentials on submit", async () => {
    loginMock.mockResolvedValue(undefined);
    const user = userEvent.setup();
    renderLoginPage();

    await user.type(screen.getByPlaceholderText("Email"), "reader@example.com");
    await user.type(screen.getByPlaceholderText("Password"), "password123");
    await user.click(screen.getByRole("button", { name: /log in/i }));

    expect(loginMock).toHaveBeenCalledWith("reader@example.com", "password123");
  });

  it("shows a generic error message when login fails", async () => {
    loginMock.mockRejectedValue(new Error("Unauthorized"));
    const user = userEvent.setup();
    renderLoginPage();

    await user.type(screen.getByPlaceholderText("Email"), "reader@example.com");
    await user.type(screen.getByPlaceholderText("Password"), "wrongpassword");
    await user.click(screen.getByRole("button", { name: /log in/i }));

    expect(await screen.findByText("Invalid email or password.")).toBeInTheDocument();
  });
});
