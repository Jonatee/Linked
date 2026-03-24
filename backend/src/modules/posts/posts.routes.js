const express = require("express");
const validate = require("../../validators/validate");
const { requireAuth, optionalAuth } = require("../../middlewares/auth");
const { writeRateLimiter } = require("../../middlewares/rate-limit");
const controller = require("./posts.controller");
const validation = require("./posts.validation");

const router = express.Router();

router.post("/", requireAuth, writeRateLimiter, validate(validation.createPostSchema), controller.create);
router.get("/feed", requireAuth, controller.feed);
router.get("/explore", optionalAuth, controller.explore);
router.get("/:postId", optionalAuth, controller.getOne);
router.patch("/:postId", requireAuth, validate(validation.updatePostSchema), controller.update);
router.delete("/:postId", requireAuth, controller.remove);
router.post("/:postId/repost", requireAuth, validate(validation.repostSchema), controller.repost);
router.post("/:postId/bookmark", requireAuth, controller.bookmark);
router.delete("/:postId/bookmark", requireAuth, controller.unbookmark);
router.post("/:postId/react", requireAuth, controller.react);
router.delete("/:postId/react", requireAuth, controller.unreact);

module.exports = router;
