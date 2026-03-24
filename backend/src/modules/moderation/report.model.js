const createBaseSchema = require("../shared/base-schema");
const { mongoose } = require("../../db/mongoose");

const reportSchema = createBaseSchema({
  reporterId: { type: String, required: true, index: true },
  targetType: { type: String, enum: ["post", "comment", "user", "media"], required: true },
  targetId: { type: String, required: true, index: true },
  reasonCode: { type: String, required: true },
  description: { type: String, default: "" },
  status: { type: String, enum: ["open", "reviewing", "resolved", "dismissed"], default: "open" },
  moderatorId: { type: String, default: null },
  resolutionNote: { type: String, default: "" },
  resolvedAt: { type: Date, default: null }
});

module.exports = mongoose.models.Report || mongoose.model("Report", reportSchema);

