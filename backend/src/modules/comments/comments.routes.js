const express = require("express");
const validate = require("../../validators/validate");
const { requireAuth, optionalAuth } = require("../../middlewares/auth");
const { writeRateLimiter, interactionRateLimiter } = require("../../middlewares/rate-limit");
const controller = require("./comments.controller");
const { createCommentSchema } = require("./comments.validation");

const router = express.Router();

router.post("/posts/:postId/comments", requireAuth, writeRateLimiter, validate(createCommentSchema), controller.create);
router.get("/posts/:postId/comments", optionalAuth, controller.list);
router.patch("/comments/:commentId", requireAuth, writeRateLimiter, validate(createCommentSchema), controller.update);
router.delete("/comments/:commentId", requireAuth, interactionRateLimiter, controller.remove);
router.post("/comments/:commentId/react", requireAuth, interactionRateLimiter, controller.react);
router.delete("/comments/:commentId/react", requireAuth, interactionRateLimiter, controller.unreact);
router.post("/comments/:commentId/reply", requireAuth, writeRateLimiter, validate(createCommentSchema), controller.reply);

module.exports = router;
