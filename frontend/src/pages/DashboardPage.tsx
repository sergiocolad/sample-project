import { useQuery } from "@tanstack/react-query";
import { getStats } from "../api/stats";
import { useAuth } from "../context/AuthContext";

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 text-center shadow-sm">
      <div className="text-3xl font-bold text-brand-700">{value}</div>
      <div className="mt-1 text-sm text-slate-500">{label}</div>
    </div>
  );
}

export function DashboardPage() {
  const { user } = useAuth();
  const { data: stats, isLoading } = useQuery({ queryKey: ["stats"], queryFn: getStats });

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold text-slate-900">Welcome back, {user?.name}</h1>
      <p className="mb-6 text-slate-500">Here&apos;s how your reading is going.</p>

      {isLoading && <p className="text-slate-500">Loading stats…</p>}

      {stats && (
        <>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <StatCard label="Books read this year" value={stats.booksReadThisYear} />
            <StatCard label="Books read all-time" value={stats.booksReadAllTime} />
            <StatCard label="Pages read this year" value={stats.pagesReadThisYear} />
            <StatCard label="Currently reading" value={stats.currentlyReading} />
          </div>

          <h2 className="mb-2 mt-8 text-lg font-semibold text-slate-900">Rating distribution</h2>
          <div className="flex items-end gap-3">
            {(["1", "2", "3", "4", "5"] as const).map((rating) => {
              const count = stats.ratingDistribution[rating];
              const max = Math.max(1, ...Object.values(stats.ratingDistribution));
              return (
                <div key={rating} className="flex flex-1 flex-col items-center gap-1">
                  <div
                    className="w-full rounded-t bg-brand-500"
                    style={{ height: `${(count / max) * 96 + 4}px` }}
                    aria-label={`${count} books rated ${rating} stars`}
                  />
                  <span className="text-xs text-slate-500">{rating}★</span>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
