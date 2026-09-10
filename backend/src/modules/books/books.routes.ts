import { Router } from "express";
import { requireAuth } from "../../middleware/auth.js";
import * as controller from "./books.controller.js";

const router = Router();

router.use(requireAuth);
router.get("/search", controller.searchHandler);
router.get("/:openLibraryId", controller.getByIdHandler);

export default router;
