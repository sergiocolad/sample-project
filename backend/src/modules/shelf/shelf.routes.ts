import { Router } from "express";
import { requireAuth } from "../../middleware/auth.js";
import * as controller from "./shelf.controller.js";

const router = Router();

router.use(requireAuth);
router.get("/", controller.listHandler);
router.post("/", controller.addHandler);
router.patch("/:id", controller.updateHandler);
router.delete("/:id", controller.removeHandler);

export default router;
