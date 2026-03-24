const createBaseSchema = require("../shared/base-schema");
const { mongoose } = require("../../db/mongoose");

const reactionSchema = createBaseSchema(
  {
    userId: { type: String, required: true, index: true },
    targetType: { type: String, enum: ["post", "comment"], required: true },
    targetId: { type: String, required: true, index: true },
    reactionType: { type: String, enum: ["like"], default: "like" }
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

reactionSchema.index({ userId: 1, targetType: 1, targetId: 1, reactionType: 1 }, { unique: true });

module.exports = mongoose.models.Reaction || mongoose.model("Reaction", reactionSchema);

