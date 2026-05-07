const Joi = require("joi");

const openConversationSchema = Joi.object({
  recipientId: Joi.string().required(),
  body: Joi.string().trim().min(1).max(5000).allow("").optional()
});

const sendMessageSchema = Joi.object({
  body: Joi.string().trim().min(1).max(5000).required()
});

module.exports = {
  openConversationSchema,
  sendMessageSchema
};
