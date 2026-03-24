const createBaseSchema = require("../shared/base-schema");
const { mongoose } = require("../../db/mongoose");

const notificationSchema = createBaseSchema(
  {
    recipientId: { type: String, required: true, index: true },
    actorId: { type: String, default: null },
    type: {
      type: String,
      enum: ["follow", "like_post", "like_comment", "comment", "reply", "repost", "mention", "system", "moderation"],
      required: true
    },
    entityType: { type: String, default: "" },
    entityId: { type: String, default: "" },
    message: { type: String, default: "" },
    isRead: { type: Boolean, default: false, index: true },
    readAt: { type: Date, default: null }
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

notificationSchema.index({ recipientId: 1, isRead: 1, createdAt: -1 });

module.exports =
  mongoose.models.Notification || mongoose.model("Notification", notificationSchema);

