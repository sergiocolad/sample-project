import { Router } from "express";
import { requireAuth } from "../../middleware/auth.js";
import * as controller from "./auth.controller.js";

const router = Router();

router.post("/register", controller.registerHandler);
router.post("/login", controller.loginHandler);
router.post("/refresh", controller.refreshHandler);
router.post("/logout", controller.logoutHandler);
router.get("/me", requireAuth, controller.meHandler);

export default router;
