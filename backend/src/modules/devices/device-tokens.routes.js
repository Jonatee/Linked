const express = require("express");
const { requireAuth } = require("../../middlewares/auth");
const controller = require("./device-tokens.controller");

const router = express.Router();

router.post("/", requireAuth, controller.register);
router.delete("/", requireAuth, controller.remove);

module.exports = router;
