const express = require("express");
const { requireAuth } = require("../../middlewares/auth");
const controller = require("./follows.controller");

const router = express.Router();

router.post("/:userId/follow", requireAuth, controller.follow);
router.delete("/:userId/follow", requireAuth, controller.unfollow);

module.exports = router;

