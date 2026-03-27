require("../config/env");

const bcrypt = require("bcryptjs");
const { connectMongo } = require("./mongoose");
const User = require("../modules/users/user.model");
const Profile = require("../modules/profiles/profile.model");
const UserSettings = require("../modules/users/user-settings.model");

async function seed() {
  await connectMongo();

  await User.updateMany(
    {
      $or: [
        { role: { $in: ["admin", "moderator"] } },
        { username: { $in: ["jonatee"] } },
        { email: { $in: ["oluwolejonatee@gmail.com"] } }
      ]
    },
    {
      isVerified: true,
      modifiedAt: new Date()
    }
  );

  const moderatorEmail = "moderator@linked.local";
  const moderatorUsername = "linked_moderator";
  const moderatorDisplayName = "LInkedModerator";
  const moderatorPassword = "Password123!";

  let moderator = await User.findOne({
    $or: [{ email: moderatorEmail }, { username: moderatorUsername }]
  });

  if (!moderator) {
    const passwordHash = await bcrypt.hash(moderatorPassword, 12);

    moderator = await User.create({
      username: moderatorUsername,
      usernameDisplay: moderatorDisplayName,
      email: moderatorEmail,
      passwordHash,
      role: "moderator",
      status: "active",
      isEmailVerified: true,
      isVerified: true
    });

    const profile = await Profile.create({
      userId: moderator.id,
      displayName: moderatorDisplayName,
      bio: "Moderator account for LInked.",
      location: "Lagos"
    });

    const settings = await UserSettings.create({
      userId: moderator.id
    });

    moderator.profileId = profile.id;
    moderator.settingsId = settings.id;
    await moderator.save();

    console.log("Moderator bootstrap completed");
    console.log("Moderator login");
    console.log(`  identity: ${moderatorEmail}`);
    console.log(`  password: ${moderatorPassword}`);
  } else {
    let shouldSave = false;

    if (moderator.role !== "moderator") {
      moderator.role = "moderator";
      shouldSave = true;
    }

    if (moderator.status !== "active") {
      moderator.status = "active";
      shouldSave = true;
    }

    if (!moderator.isEmailVerified) {
      moderator.isEmailVerified = true;
      shouldSave = true;
    }

    if (!moderator.isVerified) {
      moderator.isVerified = true;
      shouldSave = true;
    }

    if (!moderator.profileId) {
      const profile = await Profile.create({
        userId: moderator.id,
        displayName: moderator.usernameDisplay || moderator.username,
        bio: "Moderator account for LInked.",
        location: "Lagos"
      });
      moderator.profileId = profile.id;
      shouldSave = true;
    }

    if (!moderator.settingsId) {
      const settings = await UserSettings.create({
        userId: moderator.id
      });
      moderator.settingsId = settings.id;
      shouldSave = true;
    }

    if (shouldSave) {
      await moderator.save();
    }

    console.log("Moderator already exists");
    console.log(`  identity: ${moderator.email}`);
    console.log("  password: existing password unchanged");
  }

  console.log("Verified badge sync applied to admin, moderator, and jonatee accounts where present.");

  process.exit(0);
}

seed().catch((error) => {
  console.error(error);
  process.exit(1);
});
