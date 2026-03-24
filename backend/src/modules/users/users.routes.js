const express = require("express");
const validate = require("../../validators/validate");
const { requireAuth, optionalAuth } = require("../../middlewares/auth");
const controller = require("./users.controller");
const validation = require("./users.validation");

const router = express.Router();

router.patch("/profile", requireAuth, validate(validation.updateProfileSchema), controller.updateProfile);
router.patch("/settings", requireAuth, validate(validation.updateSettingsSchema), controller.updateSettings);
router.post("/:userId/block", requireAuth, controller.block);
router.delete("/:userId/block", requireAuth, controller.unblock);
router.get("/:username/followers", controller.followers);
router.get("/:username/following", controller.following);
router.get("/:username/posts", optionalAuth, controller.posts);
router.get("/:username", optionalAuth, controller.getByUsername);

module.exports = router;
