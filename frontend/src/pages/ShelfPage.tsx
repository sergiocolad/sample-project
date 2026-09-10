import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { listShelf, removeFromShelf, updateShelfEntry } from "../api/shelf";
import type { ShelfEntry, ShelfStatus } from "../types";

const TABS: { label: string; value: ShelfStatus }[] = [
  { label: "Want to Read", value: "WANT_TO_READ" },
  { label: "Reading", value: "READING" },
  { label: "Read", value: "READ" },
];

export function ShelfPage() {
  const [activeTab, setActiveTab] = useState<ShelfStatus>("READING");
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["shelf", activeTab],
    queryFn: () => listShelf(activeTab),
  });

  function invalidate() {
    void queryClient.invalidateQueries({ queryKey: ["shelf"] });
    void queryClient.invalidateQueries({ queryKey: ["stats"] });
  }

  const updateMutation = useMutation({
    mutationFn: ({ id, ...input }: { id: string } & Parameters<typeof updateShelfEntry>[1]) =>
      updateShelfEntry(id, input),
    onSuccess: invalidate,
  });

  const removeMutation = useMutation({
    mutationFn: removeFromShelf,
    onSuccess: invalidate,
  });

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold text-slate-900">My Shelf</h1>
      <div className="mb-6 flex gap-2 border-b border-slate-200">
        {TABS.map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => setActiveTab(tab.value)}
            className={`px-4 py-2 text-sm font-medium ${
              activeTab === tab.value
                ? "border-b-2 border-brand-600 text-brand-700"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {isLoading && <p className="text-slate-500">Loading…</p>}
      {data && data.data.length === 0 && <p className="text-slate-500">Nothing here yet.</p>}

      <div className="flex flex-col gap-4">
        {data?.data.map((entry: ShelfEntry) => (
          <div key={entry.id} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="font-semibold text-slate-900">{entry.book.title}</h3>
                <p className="text-sm text-slate-600">{entry.book.author}</p>
              </div>
              <button
                type="button"
                onClick={() => removeMutation.mutate(entry.id)}
                className="text-sm text-slate-400 hover:text-red-600"
              >
                Remove
              </button>
            </div>

            {entry.status === "READING" && (
              <div className="mt-3 flex items-center gap-2">
                <label className="text-sm text-slate-500" htmlFor={`page-${entry.id}`}>
                  Page
                </label>
                <input
                  id={`page-${entry.id}`}
                  type="number"
                  min={0}
                  defaultValue={entry.currentPage ?? 0}
                  onBlur={(e) =>
                    updateMutation.mutate({ id: entry.id, currentPage: Number(e.target.value) })
                  }
                  className="w-20 rounded border border-slate-300 px-2 py-1 text-sm"
                />
                <button
                  type="button"
                  onClick={() => updateMutation.mutate({ id: entry.id, status: "READ" })}
                  className="ml-auto rounded bg-brand-600 px-3 py-1 text-sm text-white hover:bg-brand-700"
                >
                  Mark as Read
                </button>
              </div>
            )}

            {entry.status === "WANT_TO_READ" && (
              <button
                type="button"
                onClick={() => updateMutation.mutate({ id: entry.id, status: "READING" })}
                className="mt-3 rounded bg-brand-600 px-3 py-1 text-sm text-white hover:bg-brand-700"
              >
                Start Reading
              </button>
            )}

            {entry.status === "READ" && (
              <div className="mt-3 flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    aria-label={`Rate ${star} stars`}
                    onClick={() => updateMutation.mutate({ id: entry.id, rating: star })}
                    className={`text-lg ${
                      (entry.rating ?? 0) >= star ? "text-amber-400" : "text-slate-300"
                    }`}
                  >
                    ★
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
