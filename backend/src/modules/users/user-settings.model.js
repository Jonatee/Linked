const createBaseSchema = require("../shared/base-schema");
const { mongoose } = require("../../db/mongoose");

const userSettingsSchema = createBaseSchema({
  userId: { type: String, required: true, unique: true, index: true },
  allowCommentsFrom: { type: String, enum: ["everyone", "following", "none"], default: "everyone" },
  allowMessagesFrom: { type: String, enum: ["everyone", "following", "none"], default: "following" },
  feedContentPreference: { type: String, enum: ["balanced", "latest"], default: "latest" },
  emailNotificationsEnabled: { type: Boolean, default: true },
  pushNotificationsEnabled: { type: Boolean, default: true },
  privacy: {
    showEmail: { type: Boolean, default: false },
    showBirthDate: { type: Boolean, default: false }
  },
  themePreference: { type: String, default: "system" },
  language: { type: String, default: "en" },
  mutedUserIds: { type: [String], default: [] },
  blockedUserIds: { type: [String], default: [] }
});

module.exports =
  mongoose.models.UserSettings || mongoose.model("UserSettings", userSettingsSchema);

