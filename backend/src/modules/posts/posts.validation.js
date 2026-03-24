const Joi = require("joi");

const createPostSchema = Joi.object({
  type: Joi.string().valid("text", "media", "repost", "quote_repost").required(),
  visibility: Joi.string().valid("public", "followers", "private").default("public"),
  content: Joi.string().allow("").max(5000).optional(),
  mediaIds: Joi.array().items(Joi.string()).max(4).default([]),
  originalPostId: Joi.string().allow(null, "").optional(),
  quoteText: Joi.string().allow("").max(500).optional()
});

const updatePostSchema = Joi.object({
  content: Joi.string().allow("").max(5000).required()
});

const repostSchema = Joi.object({
  type: Joi.string().valid("repost", "quote_repost").required(),
  quoteText: Joi.string().allow("").max(500).optional()
});

module.exports = {
  createPostSchema,
  updatePostSchema,
  repostSchema
};

