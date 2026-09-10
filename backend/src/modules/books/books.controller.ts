import type { Request, Response } from "express";
import * as booksService from "./books.service.js";
import { searchQuerySchema } from "./books.schema.js";

export async function searchHandler(req: Request, res: Response) {
  const input = searchQuerySchema.parse(req.query);
  const result = await booksService.search(input);
  res.status(200).json(result);
}

export async function getByIdHandler(req: Request<{ openLibraryId: string }>, res: Response) {
  const book = await booksService.getByOpenLibraryId(req.params.openLibraryId);
  res.status(200).json(book);
}
