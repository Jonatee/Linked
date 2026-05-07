const asyncHandler = require("../../utils/async-handler");
const { sendSuccess } = require("../../utils/response");
const messagesService = require("./messages.service");

const listConversations = asyncHandler(async (req, res) => {
  const result = await messagesService.listConversations(req.user.id, req.query);
  return sendSuccess(res, { message: "Conversations loaded", data: result });
});

const openConversation = asyncHandler(async (req, res) => {
  const result = await messagesService.openConversation(req.user.id, req.body);
  return sendSuccess(res, { statusCode: 201, message: "Conversation ready", data: result });
});

const getConversationMessages = asyncHandler(async (req, res) => {
  const result = await messagesService.listMessages(req.user.id, req.params.conversationId, req.query);
  return sendSuccess(res, { message: "Messages loaded", data: result });
});

const sendMessage = asyncHandler(async (req, res) => {
  const result = await messagesService.sendMessage(req.user.id, req.params.conversationId, req.body);
  return sendSuccess(res, { statusCode: 201, message: "Message sent", data: result });
});

const markRead = asyncHandler(async (req, res) => {
  const result = await messagesService.markConversationRead(req.user.id, req.params.conversationId);
  return sendSuccess(res, { message: "Conversation marked as read", data: result });
});

module.exports = {
  listConversations,
  openConversation,
  getConversationMessages,
  sendMessage,
  markRead
};
