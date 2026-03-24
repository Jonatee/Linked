require("../config/env");

const bcrypt = require("bcryptjs");
const { connectMongo } = require("./mongoose");
const User = require("../modules/users/user.model");
const Profile = require("../modules/profiles/profile.model");
const UserSettings = require("../modules/users/user-settings.model");
const Post = require("../modules/posts/post.model");
const Follow = require("../modules/follows/follow.model");

async function seed() {
  await connectMongo();

  await Promise.all([
    User.deleteMany({}),
    Profile.deleteMany({}),
    UserSettings.deleteMany({}),
    Post.deleteMany({}),
    Follow.deleteMany({})
  ]);

  const passwordHash = await bcrypt.hash("Password123!", 12);

  const users = await User.insertMany([
    {
      username: "linked_admin",
      usernameDisplay: "LInkedAdmin",
      email: "admin@linked.local",
      passwordHash,
      role: "admin",
      status: "active",
      isEmailVerified: true
    },
    {
      username: "ada",
      usernameDisplay: "Ada",
      email: "ada@linked.local",
      passwordHash,
      role: "user",
      status: "active",
      isEmailVerified: true
    },
    {
      username: "tunde",
      usernameDisplay: "Tunde",
      email: "tunde@linked.local",
      passwordHash,
      role: "moderator",
      status: "active",
      isEmailVerified: true
    }
  ]);

  for (const user of users) {
    const profile = await Profile.create({
      userId: user.id,
      displayName: user.usernameDisplay,
      bio: `Welcome to ${user.usernameDisplay}'s timeline on LInked.`,
      location: "Lagos"
    });

    const settings = await UserSettings.create({
      userId: user.id
    });

    user.profileId = profile.id;
    user.settingsId = settings.id;
    await user.save();
  }

  await Follow.create({
    followerId: users[1].id,
    followingId: users[2].id,
    status: "accepted"
  });

  await Post.insertMany([
    {
      authorId: users[1].id,
      type: "text",
      visibility: "public",
      content: "Building in public on LInked.",
      plainTextContent: "building in public on linked",
      hashtags: ["building", "linked"]
    },
    {
      authorId: users[2].id,
      type: "text",
      visibility: "public",
      content: "Moderation tools matter when communities grow.",
      plainTextContent: "moderation tools matter when communities grow",
      hashtags: ["moderation", "safety"]
    }
  ]);

  console.log("Seed completed");
  process.exit(0);
}

seed().catch((error) => {
  console.error(error);
  process.exit(1);
});

