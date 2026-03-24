const Joi = require("joi");

const reportSchema = Joi.object({
  targetType: Joi.string().valid("post", "comment", "user", "media").required(),
  targetId: Joi.string().required(),
  reasonCode: Joi.string().required(),
  description: Joi.string().allow("").optional()
});

const updateReportSchema = Joi.object({
  status: Joi.string().valid("open", "reviewing", "resolved", "dismissed").required(),
  resolutionNote: Joi.string().allow("").optional()
});

const actionSchema = Joi.object({
  targetType: Joi.string().required(),
  targetId: Joi.string().required(),
  actionType: Joi.string().valid("warn", "hide", "remove", "suspend", "ban", "restore").required(),
  reason: Joi.string().required(),
  metadata: Joi.object().optional()
});

module.exports = {
  reportSchema,
  updateReportSchema,
  actionSchema
};

