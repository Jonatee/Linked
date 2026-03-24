const Joi = require("joi");

const signUploadSchema = Joi.object({
  type: Joi.string().valid("image", "video").required(),
  folder: Joi.string().optional(),
  attachedEntityType: Joi.string().valid("post", "profile_avatar", "profile_banner", "comment").optional()
});

const confirmUploadSchema = Joi.object({
  type: Joi.string().valid("image", "video").required(),
  publicId: Joi.string().required(),
  version: Joi.alternatives().try(Joi.string(), Joi.number()).optional(),
  format: Joi.string().allow("").optional(),
  bytes: Joi.number().optional(),
  width: Joi.number().allow(null).optional(),
  height: Joi.number().allow(null).optional(),
  duration: Joi.number().allow(null).optional(),
  secureUrl: Joi.string().uri().required(),
  thumbnailUrl: Joi.string().allow("").optional(),
  folder: Joi.string().allow("").optional(),
  attachedEntityType: Joi.string().valid("post", "profile_avatar", "profile_banner", "comment").optional(),
  attachedEntityId: Joi.string().allow(null, "").optional(),
  altText: Joi.string().allow("").optional()
});

module.exports = {
  signUploadSchema,
  confirmUploadSchema
};

