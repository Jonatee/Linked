const express = require("express");
const validate = require("../../validators/validate");
const { requireAuth } = require("../../middlewares/auth");
const { authRateLimiter } = require("../../middlewares/rate-limit");
const controller = require("./auth.controller");
const validation = require("./auth.validation");

const router = express.Router();

router.post("/register", authRateLimiter, validate(validation.registerSchema), controller.register);
router.post("/login", authRateLimiter, validate(validation.loginSchema), controller.login);
router.post("/refresh", validate(validation.refreshSchema), controller.refresh);
router.post("/logout", requireAuth, controller.logout);
router.post("/logout-all", requireAuth, controller.logoutAll);
router.post("/forgot-password", validate(validation.forgotPasswordSchema), controller.forgotPassword);
router.post("/reset-password", validate(validation.resetPasswordSchema), controller.resetPassword);
router.get("/me", requireAuth, controller.me);

module.exports = router;

