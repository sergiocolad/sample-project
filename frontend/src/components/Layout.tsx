import type { ReactNode } from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `rounded px-3 py-2 text-sm font-medium ${
    isActive ? "bg-brand-600 text-white" : "text-slate-600 hover:bg-slate-100"
  }`;

export function Layout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
          <span className="text-lg font-bold text-brand-700">📚 Shelfie</span>
          {user && (
            <nav className="flex items-center gap-1">
              <NavLink to="/" end className={navLinkClass}>
                Dashboard
              </NavLink>
              <NavLink to="/search" className={navLinkClass}>
                Search
              </NavLink>
              <NavLink to="/shelf" className={navLinkClass}>
                My Shelf
              </NavLink>
              <button
                type="button"
                onClick={() => void logout()}
                className="ml-2 rounded px-3 py-2 text-sm font-medium text-slate-500 hover:bg-slate-100"
              >
                Log out
              </button>
            </nav>
          )}
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-4 py-6">{children}</main>
    </div>
  );
}
