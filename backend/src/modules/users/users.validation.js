const Joi = require("joi");

const updateProfileSchema = Joi.object({
  displayName: Joi.string().max(80).optional(),
  bio: Joi.string().max(280).allow("").optional(),
  website: Joi.string().allow("").optional(),
  location: Joi.string().max(120).allow("").optional(),
  occupation: Joi.string().max(120).allow("").optional(),
  accentColor: Joi.string().allow("").optional(),
  interests: Joi.array().items(Joi.string()).optional(),
  avatarMediaId: Joi.string().allow(null, "").optional(),
  bannerMediaId: Joi.string().allow(null, "").optional()
});

const updateSettingsSchema = Joi.object({
  allowCommentsFrom: Joi.string().valid("everyone", "following", "none").optional(),
  allowMessagesFrom: Joi.string().valid("everyone", "following", "none").optional(),
  feedContentPreference: Joi.string().valid("balanced", "latest").optional(),
  emailNotificationsEnabled: Joi.boolean().optional(),
  pushNotificationsEnabled: Joi.boolean().optional(),
  themePreference: Joi.string().optional(),
  language: Joi.string().optional()
});

module.exports = {
  updateProfileSchema,
  updateSettingsSchema
};
