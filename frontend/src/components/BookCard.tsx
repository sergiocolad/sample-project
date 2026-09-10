import type { BookSummary } from "../types";

interface BookCardAction {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}

interface BookCardProps {
  book: BookSummary;
  action?: BookCardAction;
}

// Missing cover art renders a placeholder — never a broken <img> — per
// docs/03-specs/SPEC-002-book-search-catalog.md#7-edge-cases.
export function BookCard({ book, action }: BookCardProps) {
  return (
    <div className="flex gap-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="h-28 w-20 flex-shrink-0 overflow-hidden rounded bg-slate-100">
        {book.coverUrl ? (
          <img src={book.coverUrl} alt={`Cover of ${book.title}`} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs text-slate-400">
            No cover
          </div>
        )}
      </div>
      <div className="flex min-w-0 flex-1 flex-col justify-between">
        <div>
          <h3 className="truncate font-semibold text-slate-900">{book.title}</h3>
          <p className="truncate text-sm text-slate-600">{book.author}</p>
          {book.publishedYear && <p className="text-xs text-slate-400">{book.publishedYear}</p>}
        </div>
        {action && (
          <button
            type="button"
            onClick={action.onClick}
            disabled={action.disabled}
            className="mt-2 self-start rounded bg-brand-600 px-3 py-1 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
          >
            {action.label}
          </button>
        )}
      </div>
    </div>
  );
}
