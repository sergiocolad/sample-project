import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { BookCard } from "./BookCard";
import type { BookSummary } from "../types";

const book: BookSummary = {
  openLibraryId: "OL1W",
  title: "Test Book",
  author: "Test Author",
  coverUrl: null,
  publishedYear: 2020,
};

describe("BookCard", () => {
  it("renders a placeholder instead of a broken image when coverUrl is null", () => {
    render(<BookCard book={book} />);
    expect(screen.getByText("No cover")).toBeInTheDocument();
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });

  it("renders the cover image when coverUrl is present", () => {
    render(<BookCard book={{ ...book, coverUrl: "https://example.com/cover.jpg" }} />);
    expect(screen.getByRole("img", { name: /cover of test book/i })).toBeInTheDocument();
  });

  it("invokes the action callback when its button is clicked", () => {
    const onClick = vi.fn();
    render(<BookCard book={book} action={{ label: "+ Want to Read", onClick }} />);

    fireEvent.click(screen.getByRole("button", { name: "+ Want to Read" }));

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("disables the action button when disabled is true", () => {
    render(<BookCard book={book} action={{ label: "Adding…", onClick: vi.fn(), disabled: true }} />);
    expect(screen.getByRole("button", { name: "Adding…" })).toBeDisabled();
  });
});
