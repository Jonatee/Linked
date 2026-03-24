const createBaseSchema = require("../shared/base-schema");
const { mongoose } = require("../../db/mongoose");

const followSchema = createBaseSchema({
  followerId: { type: String, required: true, index: true },
  followingId: { type: String, required: true, index: true },
  status: {
    type: String,
    enum: ["active", "pending", "accepted", "blocked"],
    default: "accepted"
  }
});

followSchema.index({ followerId: 1, followingId: 1 }, { unique: true });

module.exports = mongoose.models.Follow || mongoose.model("Follow", followSchema);

