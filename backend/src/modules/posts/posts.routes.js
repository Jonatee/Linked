const express = require("express");
const validate = require("../../validators/validate");
const { requireAuth, optionalAuth } = require("../../middlewares/auth");
const { writeRateLimiter, interactionRateLimiter } = require("../../middlewares/rate-limit");
const controller = require("./posts.controller");
const validation = require("./posts.validation");

const router = express.Router();

router.post("/", requireAuth, writeRateLimiter, validate(validation.createPostSchema), controller.create);
router.get("/feed", requireAuth, controller.feed);
router.get("/explore", optionalAuth, controller.explore);
router.get("/:postId", optionalAuth, controller.getOne);
router.patch("/:postId", requireAuth, writeRateLimiter, validate(validation.updatePostSchema), controller.update);
router.delete("/:postId", requireAuth, interactionRateLimiter, controller.remove);
router.post("/:postId/repost", requireAuth, interactionRateLimiter, validate(validation.repostSchema), controller.repost);
router.post("/:postId/bookmark", requireAuth, interactionRateLimiter, controller.bookmark);
router.delete("/:postId/bookmark", requireAuth, interactionRateLimiter, controller.unbookmark);
router.post("/:postId/react", requireAuth, interactionRateLimiter, controller.react);
router.delete("/:postId/react", requireAuth, interactionRateLimiter, controller.unreact);

module.exports = router;
