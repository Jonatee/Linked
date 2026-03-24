const createBaseSchema = require("../shared/base-schema");
const { mongoose } = require("../../db/mongoose");

const mediaSchema = createBaseSchema({
  ownerId: { type: String, required: true, index: true },
  type: { type: String, enum: ["image", "video"], required: true },
  resourceType: { type: String, default: "image" },
  provider: { type: String, default: "cloudinary" },
  publicId: { type: String, required: true, index: true },
  version: { type: String, default: "" },
  format: { type: String, default: "" },
  bytes: { type: Number, default: 0 },
  width: { type: Number, default: null },
  height: { type: Number, default: null },
  duration: { type: Number, default: null },
  secureUrl: { type: String, required: true },
  thumbnailUrl: { type: String, default: "" },
  blurhash: { type: String, default: "" },
  moderationStatus: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: "approved"
  },
  folder: { type: String, default: "" },
  altText: { type: String, default: "" },
  metadata: { type: Object, default: {} },
  usageStatus: {
    type: String,
    enum: ["temp", "attached", "orphaned", "deleted"],
    default: "temp"
  },
  attachedEntityType: {
    type: String,
    enum: ["post", "profile_avatar", "profile_banner", "comment"],
    default: null
  },
  attachedEntityId: { type: String, default: null, index: true }
});

module.exports = mongoose.models.Media || mongoose.model("Media", mediaSchema);
