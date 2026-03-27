const createBaseSchema = require("../shared/base-schema");
const { mongoose } = require("../../db/mongoose");

const userSchema = createBaseSchema({
  username: { type: String, required: true, unique: true, index: true },
  usernameDisplay: { type: String, required: true },
  email: { type: String, required: true, unique: true, index: true },
  passwordHash: { type: String, required: true },
  role: {
    type: String,
    enum: ["user", "moderator", "admin"],
    default: "user",
    index: true
  },
  status: {
    type: String,
    enum: ["active", "suspended", "banned", "pending_verification"],
    default: "pending_verification",
    index: true
  },
  isEmailVerified: { type: Boolean, default: false },
  isVerified: { type: Boolean, default: false, index: true },
  authProviders: { type: [String], default: ["local"] },
  lastLoginAt: { type: Date, default: null },
  profileId: { type: String, default: null },
  settingsId: { type: String, default: null },
  stats: {
    followerCount: { type: Number, default: 0 },
    followingCount: { type: Number, default: 0 },
    postCount: { type: Number, default: 0 },
    commentCount: { type: Number, default: 0 },
    bookmarkCount: { type: Number, default: 0 },
    repostCount: { type: Number, default: 0 }
  },
  flags: {
    isPrivate: { type: Boolean, default: false },
    isDeactivated: { type: Boolean, default: false }
  }
});

module.exports = mongoose.models.User || mongoose.model("User", userSchema);
