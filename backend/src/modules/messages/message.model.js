const createBaseSchema = require("../shared/base-schema");
const { mongoose } = require("../../db/mongoose");

const messageSchema = createBaseSchema(
  {
    conversationId: { type: String, required: true, index: true },
    senderId: { type: String, required: true, index: true },
    recipientId: { type: String, required: true, index: true },
    body: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ["sent", "read"],
      default: "sent",
      index: true
    },
    replyTo: {
      messageId: { type: String, default: null },
      body: { type: String, default: null },
      senderName: { type: String, default: null }
    },
    readAt: { type: Date, default: null }
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

messageSchema.index({ conversationId: 1, createdAt: -1 });
messageSchema.index({ recipientId: 1, readAt: 1, createdAt: -1 });

module.exports = mongoose.models.Message || mongoose.model("Message", messageSchema);
