const createBaseSchema = require("../shared/base-schema");
const { mongoose } = require("../../db/mongoose");

const bookmarkSchema = createBaseSchema(
  {
    userId: { type: String, required: true, index: true },
    postId: { type: String, required: true, index: true }
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

bookmarkSchema.index({ userId: 1, postId: 1 }, { unique: true });

module.exports = mongoose.models.Bookmark || mongoose.model("Bookmark", bookmarkSchema);

