const createBaseSchema = require("../shared/base-schema");
const { mongoose } = require("../../db/mongoose");

const messageConversationSchema = createBaseSchema(
  {
    participantIds: {
      type: [String],
      required: true,
      validate: {
        validator(value) {
          return Array.isArray(value) && value.length === 2 && new Set(value).size === 2;
        },
        message: "A conversation must contain exactly two distinct participants"
      }
    },
    participantKey: { type: String, required: true, unique: true, index: true },
    createdById: { type: String, required: true, index: true },
    lastMessageId: { type: String, default: null },
    lastMessageSenderId: { type: String, default: null },
    lastMessageText: { type: String, default: "" },
    lastMessageAt: { type: Date, default: null },
    archivedByIds: { type: [String], default: [] },
    mutedByIds: { type: [String], default: [] }
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

messageConversationSchema.index({ participantIds: 1, lastMessageAt: -1 });

module.exports =
  mongoose.models.MessageConversation || mongoose.model("MessageConversation", messageConversationSchema);
