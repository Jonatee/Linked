const express = require("express");
const validate = require("../../validators/validate");
const { requireAuth, optionalAuth } = require("../../middlewares/auth");
const controller = require("./comments.controller");
const { createCommentSchema } = require("./comments.validation");

const router = express.Router();

router.post("/posts/:postId/comments", requireAuth, validate(createCommentSchema), controller.create);
router.get("/posts/:postId/comments", optionalAuth, controller.list);
router.patch("/comments/:commentId", requireAuth, validate(createCommentSchema), controller.update);
router.delete("/comments/:commentId", requireAuth, controller.remove);
router.post("/comments/:commentId/react", requireAuth, controller.react);
router.delete("/comments/:commentId/react", requireAuth, controller.unreact);
router.post("/comments/:commentId/reply", requireAuth, validate(createCommentSchema), controller.reply);

module.exports = router;
