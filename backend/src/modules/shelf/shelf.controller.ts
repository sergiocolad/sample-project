import type { Request, Response } from "express";
import * as shelfService from "./shelf.service.js";
import { addToShelfSchema, listShelfQuerySchema, updateShelfEntrySchema } from "./shelf.schema.js";

export async function addHandler(req: Request, res: Response) {
  const input = addToShelfSchema.parse(req.body);
  const { entry, wasCreated } = await shelfService.addToShelf(req.user!.id, input);
  res.status(wasCreated ? 201 : 200).json(entry);
}

export async function listHandler(req: Request, res: Response) {
  const query = listShelfQuerySchema.parse(req.query);
  const result = await shelfService.listShelf(req.user!.id, query);
  res.status(200).json(result);
}

export async function updateHandler(req: Request<{ id: string }>, res: Response) {
  const input = updateShelfEntrySchema.parse(req.body);
  const entry = await shelfService.updateShelfEntry(req.user!.id, req.params.id, input);
  res.status(200).json(entry);
}

export async function removeHandler(req: Request<{ id: string }>, res: Response) {
  await shelfService.removeFromShelf(req.user!.id, req.params.id);
  res.status(204).send();
}
