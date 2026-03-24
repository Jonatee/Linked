const createBaseSchema = require("../shared/base-schema");
const { mongoose } = require("../../db/mongoose");

const authSessionSchema = createBaseSchema({
  userId: { type: String, required: true, index: true },
  refreshTokenHash: { type: String, required: true },
  userAgent: { type: String, default: "" },
  ipAddress: { type: String, default: "" },
  expiresAt: { type: Date, required: true, index: true },
  isRevoked: { type: Boolean, default: false },
  revokedAt: { type: Date, default: null }
});

module.exports = mongoose.models.AuthSession || mongoose.model("AuthSession", authSessionSchema);

