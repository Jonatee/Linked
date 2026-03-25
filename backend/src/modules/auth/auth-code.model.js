const createBaseSchema = require("../shared/base-schema");
const { mongoose } = require("../../db/mongoose");

const authCodeSchema = createBaseSchema({
  userId: { type: String, default: null, index: true },
  email: { type: String, required: true, index: true },
  codeHash: { type: String, required: true },
  purpose: {
    type: String,
    enum: ["register_verify", "reset_password"],
    required: true,
    index: true
  },
  expiresAt: { type: Date, required: true, index: true },
  consumedAt: { type: Date, default: null },
  metadata: { type: Object, default: {} }
});

authCodeSchema.index({ email: 1, purpose: 1, expiresAt: 1 });

module.exports = mongoose.models.AuthCode || mongoose.model("AuthCode", authCodeSchema);
