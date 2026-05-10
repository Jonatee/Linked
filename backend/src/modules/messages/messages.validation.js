const Joi = require("joi");

const openConversationSchema = Joi.object({
  recipientId: Joi.string().required(),
  body: Joi.string().trim().min(1).max(5000).allow("").optional()
});

const sendMessageSchema = Joi.object({
  body: Joi.string().trim().min(1).max(5000).required(),
  replyTo: Joi.object({
    messageId: Joi.string().required(),
    body: Joi.string().max(200).optional().allow("", null),
    senderName: Joi.string().max(100).optional().allow("", null)
  }).optional()
});

module.exports = {
  openConversationSchema,
  sendMessageSchema
};
