const createBaseSchema = require("../shared/base-schema");
const { mongoose } = require("../../db/mongoose");

const moderationActionSchema = createBaseSchema(
  {
    actorId: { type: String, required: true, index: true },
    targetType: { type: String, required: true },
    targetId: { type: String, required: true, index: true },
    actionType: { type: String, enum: ["warn", "hide", "remove", "suspend", "ban", "restore"], required: true },
    reason: { type: String, required: true },
    metadata: { type: Object, default: {} }
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

module.exports =
  mongoose.models.ModerationAction || mongoose.model("ModerationAction", moderationActionSchema);

