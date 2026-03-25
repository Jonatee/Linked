require("../config/env");

const bcrypt = require("bcryptjs");
const { connectMongo } = require("./mongoose");
const User = require("../modules/users/user.model");
const Profile = require("../modules/profiles/profile.model");
const UserSettings = require("../modules/users/user-settings.model");

async function seed() {
  await connectMongo();

  const adminEmail = "admin@linked.local";
  const adminUsername = "linked_admin";
  const adminDisplayName = "LInkedAdmin";
  const adminPassword = "Password123!";

  let admin = await User.findOne({
    $or: [{ email: adminEmail }, { username: adminUsername }]
  });

  if (!admin) {
    const passwordHash = await bcrypt.hash(adminPassword, 12);

    admin = await User.create({
      username: adminUsername,
      usernameDisplay: adminDisplayName,
      email: adminEmail,
      passwordHash,
      role: "admin",
      status: "active",
      isEmailVerified: true
    });

    const profile = await Profile.create({
      userId: admin.id,
      displayName: adminDisplayName,
      bio: "Administrator account for LInked.",
      location: "Lagos"
    });

    const settings = await UserSettings.create({
      userId: admin.id
    });

    admin.profileId = profile.id;
    admin.settingsId = settings.id;
    await admin.save();

    console.log("Admin bootstrap completed");
    console.log("Admin login");
    console.log(`  identity: ${adminEmail}`);
    console.log(`  password: ${adminPassword}`);
  } else {
    let shouldSave = false;

    if (admin.role !== "admin") {
      admin.role = "admin";
      shouldSave = true;
    }

    if (admin.status !== "active") {
      admin.status = "active";
      shouldSave = true;
    }

    if (!admin.isEmailVerified) {
      admin.isEmailVerified = true;
      shouldSave = true;
    }

    if (!admin.profileId) {
      const profile = await Profile.create({
        userId: admin.id,
        displayName: admin.usernameDisplay || admin.username,
        bio: "Administrator account for LInked.",
        location: "Lagos"
      });
      admin.profileId = profile.id;
      shouldSave = true;
    }

    if (!admin.settingsId) {
      const settings = await UserSettings.create({
        userId: admin.id
      });
      admin.settingsId = settings.id;
      shouldSave = true;
    }

    if (shouldSave) {
      await admin.save();
    }

    console.log("Admin already exists");
    console.log(`  identity: ${admin.email}`);
    console.log("  password: existing password unchanged");
  }

  process.exit(0);
}

seed().catch((error) => {
  console.error(error);
  process.exit(1);
});
