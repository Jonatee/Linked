const { mongoose } = require("../../db/mongoose");
const { Schema } = require("mongoose");
const { v4: uuidv4 } = require("uuid");

const deviceTokenSchema = new Schema(
  {
    id: { type: String, default: uuidv4, index: true },
    userId: { type: String, required: true, index: true },
    token: { type: String, required: true },
    platform: { type: String, enum: ["android", "ios", "web"], default: "android" }
  },
  { timestamps: true }
);

deviceTokenSchema.index({ userId: 1, token: 1 }, { unique: true });

module.exports =
  mongoose.models.DeviceToken || mongoose.model("DeviceToken", deviceTokenSchema);
