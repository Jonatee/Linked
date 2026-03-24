const createBaseSchema = require("../shared/base-schema");
const { mongoose } = require("../../db/mongoose");

const hashtagSchema = createBaseSchema({
  tag: { type: String, required: true },
  normalizedTag: { type: String, required: true, unique: true, index: true },
  usageCount: { type: Number, default: 0 },
  lastUsedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.models.Hashtag || mongoose.model("Hashtag", hashtagSchema);

