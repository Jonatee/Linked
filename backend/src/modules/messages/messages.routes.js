const express = require("express");
const validate = require("../../validators/validate");
const { requireAuth } = require("../../middlewares/auth");
const { writeRateLimiter } = require("../../middlewares/rate-limit");
const controller = require("./messages.controller");
const { openConversationSchema, sendMessageSchema } = require("./messages.validation");

const router = express.Router();

router.get("/messages/conversations", requireAuth, controller.listConversations);
router.post("/messages/conversations", requireAuth, writeRateLimiter, validate(openConversationSchema), controller.openConversation);
router.get("/messages/conversations/:conversationId/messages", requireAuth, controller.getConversationMessages);
router.post(
  "/messages/conversations/:conversationId/messages",
  requireAuth,
  writeRateLimiter,
  validate(sendMessageSchema),
  controller.sendMessage
);
router.patch("/messages/conversations/:conversationId/read", requireAuth, controller.markRead);

module.exports = router;
