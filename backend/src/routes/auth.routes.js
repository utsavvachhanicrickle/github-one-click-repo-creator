import express from "express";
import {
  githubLogin,
  githubCallback,
  getMe,
  logoutUser,
  loginController,
  registerUserController,
  registerPersonalUserController,
  adminPersonalUserRelationController,
} from "../controllers/auth.controller.js";
import {
  authenticateUser,
  authenticateAdminUser,
} from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/github", githubLogin);
router.get("/github/callback", githubCallback);
router.get("/me", authenticateUser, getMe);
router.post("/logout", logoutUser);

router.post("/login", loginController);
router.post("/register-user", registerUserController);

router.post(
  "/register-personal-user",
  authenticateUser,
  authenticateAdminUser,
  registerPersonalUserController,
);
router.get(
  "/admin-personal-user-relation",
  authenticateUser,
  authenticateAdminUser,
  adminPersonalUserRelationController,
);

export default router;
