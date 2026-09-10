import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { searchBooks } from "../api/books";
import { addToShelf } from "../api/shelf";
import { BookCard } from "../components/BookCard";

export function SearchPage() {
  const [query, setQuery] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState("");
  const queryClient = useQueryClient();

  const { data, isFetching, error } = useQuery({
    queryKey: ["books-search", submittedQuery],
    queryFn: () => searchBooks(submittedQuery),
    enabled: submittedQuery.length >= 2,
  });

  const addMutation = useMutation({
    mutationFn: addToShelf,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["shelf"] });
      void queryClient.invalidateQueries({ queryKey: ["stats"] });
    },
  });

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold text-slate-900">Find a book</h1>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setSubmittedQuery(query.trim());
        }}
        className="mb-6 flex gap-2"
      >
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by title or author…"
          className="flex-1 rounded border border-slate-300 px-3 py-2"
        />
        <button
          type="submit"
          className="rounded bg-brand-600 px-4 py-2 font-medium text-white hover:bg-brand-700"
        >
          Search
        </button>
      </form>

      {isFetching && <p className="text-slate-500">Searching…</p>}
      {error && (
        <p className="text-red-600">
          Couldn&apos;t reach the book catalog right now. Please try again shortly.
        </p>
      )}
      {data && data.data.length === 0 && (
        <p className="text-slate-500">No results for &quot;{submittedQuery}&quot;.</p>
      )}

      <div className="flex flex-col gap-3">
        {data?.data.map((book) => (
          <BookCard
            key={book.openLibraryId}
            book={book}
            action={{
              label: addMutation.isPending ? "Adding…" : "+ Want to Read",
              onClick: () => addMutation.mutate({ openLibraryId: book.openLibraryId, status: "WANT_TO_READ" }),
              disabled: addMutation.isPending,
            }}
          />
        ))}
      </div>
    </div>
  );
}
