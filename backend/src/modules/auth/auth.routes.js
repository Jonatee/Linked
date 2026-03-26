const express = require("express");
const validate = require("../../validators/validate");
const { requireAuth } = require("../../middlewares/auth");
const {
  loginRateLimiter,
  registerRateLimiter,
  forgotPasswordRateLimiter,
  verifyEmailRateLimiter,
  resetPasswordRateLimiter,
  refreshRateLimiter
} = require("../../middlewares/rate-limit");
const controller = require("./auth.controller");
const validation = require("./auth.validation");

const router = express.Router();

router.post("/register", registerRateLimiter, validate(validation.registerSchema), controller.register);
router.post("/verify-email", verifyEmailRateLimiter, validate(validation.verifyEmailSchema), controller.verifyEmail);
router.post("/login", loginRateLimiter, validate(validation.loginSchema), controller.login);
router.post("/refresh", refreshRateLimiter, validate(validation.refreshSchema), controller.refresh);
router.post("/logout", requireAuth, controller.logout);
router.post("/logout-all", requireAuth, controller.logoutAll);
router.post("/forgot-password", forgotPasswordRateLimiter, validate(validation.forgotPasswordSchema), controller.forgotPassword);
router.post("/reset-password", resetPasswordRateLimiter, validate(validation.resetPasswordSchema), controller.resetPassword);
router.post("/change-password", requireAuth, validate(validation.changePasswordSchema), controller.changePassword);
router.get("/me", requireAuth, controller.me);

module.exports = router;
