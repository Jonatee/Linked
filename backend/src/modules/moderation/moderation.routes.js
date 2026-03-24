const express = require("express");
const validate = require("../../validators/validate");
const { requireAuth, requireRole } = require("../../middlewares/auth");
const controller = require("./moderation.controller");
const validation = require("./moderation.validation");

const router = express.Router();

router.post("/reports", requireAuth, validate(validation.reportSchema), controller.createReport);
router.get("/moderation/reports", requireAuth, requireRole("moderator", "admin"), controller.listReports);
router.patch(
  "/moderation/reports/:id",
  requireAuth,
  requireRole("moderator", "admin"),
  validate(validation.updateReportSchema),
  controller.updateReport
);
router.post(
  "/moderation/actions",
  requireAuth,
  requireRole("moderator", "admin"),
  validate(validation.actionSchema),
  controller.createAction
);

module.exports = router;

