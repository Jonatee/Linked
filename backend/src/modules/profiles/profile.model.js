const createBaseSchema = require("../shared/base-schema");
const { mongoose } = require("../../db/mongoose");

const profileSchema = createBaseSchema({
  userId: { type: String, required: true, index: true, unique: true },
  displayName: { type: String, required: true },
  bio: { type: String, default: "" },
  website: { type: String, default: "" },
  location: { type: String, default: "" },
  dateOfBirth: { type: Date, default: null },
  avatarMediaId: { type: String, default: null },
  bannerMediaId: { type: String, default: null },
  accentColor: { type: String, default: "#7a1111" },
  interests: { type: [String], default: [] },
  occupation: { type: String, default: "" },
  socialLinks: {
    type: [
      {
        label: String,
        url: String
      }
    ],
    default: []
  }
});

module.exports = mongoose.models.Profile || mongoose.model("Profile", profileSchema);

