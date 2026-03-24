const express = require("express");
const { requireAuth } = require("../../middlewares/auth");
const controller = require("./bookmarks.controller");

const router = express.Router();

router.get("/", requireAuth, controller.list);

module.exports = router;
