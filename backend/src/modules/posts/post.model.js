const createBaseSchema = require("../shared/base-schema");
const { mongoose } = require("../../db/mongoose");

const postSchema = createBaseSchema({
  authorId: { type: String, required: true, index: true },
  type: { type: String, enum: ["text", "media", "repost", "quote_repost"], default: "text" },
  visibility: { type: String, enum: ["public", "followers", "private"], default: "public" },
  content: { type: String, default: "" },
  plainTextContent: { type: String, default: "" },
  hashtags: { type: [String], default: [], index: true },
  mentionUserIds: { type: [String], default: [] },
  mediaIds: { type: [String], default: [] },
  originalPostId: { type: String, default: null, index: true },
  quoteText: { type: String, default: "" },
  status: { type: String, enum: ["active", "hidden", "removed", "under_review"], default: "active", index: true },
  moderationStatus: { type: String, enum: ["approved", "pending", "rejected"], default: "approved" },
  isEdited: { type: Boolean, default: false },
  editedAt: { type: Date, default: null },
  stats: {
    likeCount: { type: Number, default: 0 },
    commentCount: { type: Number, default: 0 },
    repostCount: { type: Number, default: 0 },
    shareCount: { type: Number, default: 0 },
    bookmarkCount: { type: Number, default: 0 },
    viewCount: { type: Number, default: 0 }
  },
  rankingScore: { type: Number, default: 0 }
});

postSchema.index({ authorId: 1, createdAt: -1 });
postSchema.index({ createdAt: -1 });
postSchema.index({ status: 1, visibility: 1 });
postSchema.index({ content: "text", plainTextContent: "text" });

module.exports = mongoose.models.Post || mongoose.model("Post", postSchema);

