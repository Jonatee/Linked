const crypto = require("crypto");
const AppError = require("../../utils/app-error");
const { normalizeEmail, normalizeUsername } = require("../../utils/helpers");
const { hashPassword, comparePassword } = require("../../utils/password");
const { signAccessToken, signRefreshToken, verifyRefreshToken } = require("../../utils/tokens");
const User = require("../users/user.model");
const Profile = require("../profiles/profile.model");
const UserSettings = require("../users/user-settings.model");
const Media = require("../media/media.model");
const authRepository = require("./auth.repository");
const env = require("../../config/env");

function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

async function issueTokens(user, context = {}) {
  const accessToken = signAccessToken({ sub: user.id, role: user.role });
  const refreshToken = signRefreshToken({ sub: user.id, role: user.role });
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  await authRepository.create({
    userId: user.id,
    refreshTokenHash: hashToken(refreshToken),
    userAgent: context.userAgent || "",
    ipAddress: context.ipAddress || "",
    expiresAt
  });

  return { accessToken, refreshToken };
}

async function register(payload, context) {
  const username = normalizeUsername(payload.username);
  const email = normalizeEmail(payload.email);

  const existing = await User.findOne({
    $or: [{ username }, { email }]
  });

  if (existing) {
    throw new AppError("Username or email already in use", 409);
  }

  const passwordHash = await hashPassword(payload.password);
  const user = await User.create({
    username,
    usernameDisplay: payload.username,
    email,
    passwordHash,
    status: "active"
  });

  const profile = await Profile.create({
    userId: user.id,
    displayName: payload.username
  });

  const settings = await UserSettings.create({ userId: user.id });
  user.profileId = profile.id;
  user.settingsId = settings.id;
  await user.save();

  const tokens = await issueTokens(user, context);
  return { user, ...tokens };
}

async function login(payload, context) {
  const identity = String(payload.identity).trim().toLowerCase();
  const user = await User.findOne({
    $or: [{ email: identity }, { username: identity }],
    deletedAt: null
  });

  if (!user) {
    throw new AppError("Invalid credentials", 401);
  }

  const isValid = await comparePassword(payload.password, user.passwordHash);
  if (!isValid) {
    throw new AppError("Invalid credentials", 401);
  }

  user.lastLoginAt = new Date();
  user.modifiedAt = new Date();
  await user.save();

  const tokens = await issueTokens(user, context);
  return { user, ...tokens };
}

async function refreshToken(refreshToken, context) {
  if (!refreshToken) {
    throw new AppError("Refresh token is required", 401);
  }

  const payload = verifyRefreshToken(refreshToken);
  const session = await authRepository.findOne({
    userId: payload.sub,
    refreshTokenHash: hashToken(refreshToken),
    isRevoked: false
  });

  if (!session) {
    throw new AppError("Refresh session not found", 401);
  }

  session.isRevoked = true;
  session.revokedAt = new Date();
  await session.save();

  const user = await User.findOne({ id: payload.sub, deletedAt: null });
  if (!user) {
    throw new AppError("User not found", 404);
  }

  return issueTokens(user, context);
}

async function logout(userId, refreshToken) {
  if (!refreshToken) {
    return;
  }

  await authRepository.updateOne(
    { userId, refreshTokenHash: hashToken(refreshToken), isRevoked: false },
    { isRevoked: true, revokedAt: new Date(), modifiedAt: new Date() }
  );
}

async function logoutAll(userId) {
  await authRepository.revokeAllForUser(userId);
}

async function me(userId) {
  const user = await User.findOne({ id: userId }).lean();
  const profile = await Profile.findOne({ userId }).lean();
  const settings = await UserSettings.findOne({ userId }).lean();

  if (profile) {
    const mediaIds = [profile.avatarMediaId, profile.bannerMediaId].filter(Boolean);
    const mediaItems = mediaIds.length ? await Media.find({ id: { $in: mediaIds }, deletedAt: null }).lean() : [];
    return {
      user,
      profile: {
        ...profile,
        avatarMedia: mediaItems.find((item) => item.id === profile.avatarMediaId) || null,
        bannerMedia: mediaItems.find((item) => item.id === profile.bannerMediaId) || null
      },
      settings
    };
  }

  return { user, profile, settings };
}

async function forgotPassword(email) {
  return {
    email: normalizeEmail(email),
    resetToken: `stub-reset-${Date.now()}`,
    message: "Email delivery is stubbed for local development"
  };
}

async function resetPassword() {
  return {
    message: "Reset password flow scaffolded for future mail/token verification integration"
  };
}

function buildCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax",
    secure: env.nodeEnv === "production",
    path: "/"
  };
}

module.exports = {
  register,
  login,
  refreshToken,
  logout,
  logoutAll,
  me,
  forgotPassword,
  resetPassword,
  buildCookieOptions
};
