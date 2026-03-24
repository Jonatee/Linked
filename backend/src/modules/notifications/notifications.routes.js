const express = require("express");
const { requireAuth } = require("../../middlewares/auth");
const controller = require("./notifications.controller");

const router = express.Router();

router.get("/", requireAuth, controller.list);
router.patch("/:id/read", requireAuth, controller.readOne);
router.patch("/read-all", requireAuth, controller.readAll);

module.exports = router;

