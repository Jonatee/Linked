const express = require("express");
const Joi = require("joi");
const validate = require("../../validators/validate");
const { requireAuth, requireRole } = require("../../middlewares/auth");
const controller = require("./admin.controller");

const router = express.Router();

router.use(requireAuth, requireRole("admin"));

router.get("/users", controller.users);
router.patch(
  "/users/:id/status",
  validate(Joi.object({ status: Joi.string().valid("active", "suspended", "banned").required() })),
  controller.updateStatus
);
router.get("/stats", controller.stats);
router.get("/audit-logs", controller.auditLogs);

module.exports = router;

