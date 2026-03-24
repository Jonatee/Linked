const createBaseSchema = require("../shared/base-schema");
const { mongoose } = require("../../db/mongoose");

const repostSchema = createBaseSchema({
  userId: { type: String, required: true, index: true },
  postId: { type: String, required: true, index: true },
  type: { type: String, enum: ["repost", "quote_repost"], required: true },
  quoteText: { type: String, default: "" }
});

repostSchema.index({ userId: 1, postId: 1, type: 1 }, { unique: true });

module.exports = mongoose.models.Repost || mongoose.model("Repost", repostSchema);

