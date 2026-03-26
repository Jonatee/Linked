const crypto = require("crypto");
const AppError = require("../../utils/app-error");
const { normalizeEmail, normalizeUsername } = require("../../utils/helpers");
const { hashPassword, comparePassword } = require("../../utils/password");
const { signAccessToken, signRefreshToken, verifyRefreshToken } = require("../../utils/tokens");
const User = require("../users/user.model");
const Profile = require("../profiles/profile.model");
const UserSettings = require("../users/user-settings.model");
const Media = require("../media/media.model");
const AuthCode = require("./auth-code.model");
const authRepository = require("./auth.repository");
const env = require("../../config/env");
const { sendMail } = require("../../config/mailer");
const {
  PRODUCT_NAME,
  buildWelcomeEmail,
  buildResetPasswordEmail,
  buildPasswordChangedEmail,
  buildVerifyEmail
} = require("./auth-email.templates");
const { logInfo, logError } = require("../../config/logger");

const REGISTER_CODE_MINUTES = 15;
const RESET_CODE_MINUTES = 30;
const ALLOWED_EMAIL_DOMAINS = new Set(
  ["gmail.com", "outlook.com", "yahoo.com", "yahoo.co.uk", "hotmail.com", "live.com"]
    .concat(
      String(process.env.VERIFIED_EMAIL_DOMAINS || "")
        .split(",")
        .map((item) => item.trim().toLowerCase())
        .filter(Boolean)
    )
);

function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function hashCode(code) {
  return crypto.createHash("sha256").update(String(code)).digest("hex");
}

function createNumericCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function maskEmail(email = "") {
  const [local, domain] = String(email).split("@");
  if (!local || !domain) {
    return email;
  }

  return `${local.slice(0, 2)}***@${domain}`;
}

function maskIdentity(identity = "") {
  const value = String(identity || "").trim().toLowerCase();
  return value.includes("@") ? maskEmail(value) : value;
}

function getDomain(email = "") {
  return String(email).split("@")[1]?.toLowerCase() || "";
}

function ensureAllowedEmailDomain(email) {
  const domain = getDomain(email);
  if (!ALLOWED_EMAIL_DOMAINS.has(domain)) {
    throw new AppError("Only Gmail, Outlook, Yahoo, and verified domains are allowed", 400);
  }
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

  logInfo("Auth session issued", {
    userId: user.id,
    role: user.role,
    hasUserAgent: Boolean(context.userAgent),
    hasIpAddress: Boolean(context.ipAddress)
  });

  return { accessToken, refreshToken };
}

async function createAuthCode({ userId = null, email, purpose, expirationMinutes }) {
  const code = createNumericCode();
  const expiresAt = new Date(Date.now() + expirationMinutes * 60 * 1000);

  await AuthCode.updateMany(
    { email, purpose, consumedAt: null },
    { consumedAt: new Date(), modifiedAt: new Date() }
  );

  await AuthCode.create({
    userId,
    email,
    codeHash: hashCode(code),
    purpose,
    expiresAt
  });

  return {
    code,
    expiresAt
  };
}

async function consumeAuthCode({ email, code, purpose }) {
  const authCode = await AuthCode.findOne({
    email,
    purpose,
    codeHash: hashCode(code),
    consumedAt: null,
    expiresAt: { $gt: new Date() },
    deletedAt: null
  });

  if (!authCode) {
    throw new AppError("Invalid or expired code", 400);
  }

  authCode.consumedAt = new Date();
  authCode.modifiedAt = new Date();
  await authCode.save();

  return authCode;
}

async function sendVerificationEmail(user, code) {
  const verifyUrl = `${env.frontendOrigin}/auth/verify-email?email=${encodeURIComponent(user.email)}`;
  const verifyEmail = buildVerifyEmail({
    userName: user.usernameDisplay || user.username,
    verifyUrl,
    otpCode: code,
    supportEmail: env.mail.from,
    expirationMinutes: REGISTER_CODE_MINUTES
  });

  await sendMail({
    to: user.email,
    subject: verifyEmail.subject,
    text: verifyEmail.text,
    html: verifyEmail.html
  });
}

async function issueVerificationCode(user) {
  const { code } = await createAuthCode({
    userId: user.id,
    email: user.email,
    purpose: "register_verify",
    expirationMinutes: REGISTER_CODE_MINUTES
  });

  await sendVerificationEmail(user, code);
}

async function sendWelcomeEmail(user) {
  const welcomeEmail = buildWelcomeEmail({
    userName: user.usernameDisplay || user.username,
    dashboardUrl: `${env.frontendOrigin}/home`,
    supportEmail: env.mail.from
  });

  return sendMail({
    to: user.email,
    subject: welcomeEmail.subject,
    text: welcomeEmail.text,
    html: welcomeEmail.html
  });
}

async function sendPasswordChangedEmail(user) {
  const changedEmail = buildPasswordChangedEmail({
    userName: user.usernameDisplay || user.username,
    changedAt: new Date().toLocaleString(),
    securityUrl: `${env.frontendOrigin}/settings`,
    supportEmail: env.mail.from
  });

  return sendMail({
    to: user.email,
    subject: changedEmail.subject,
    text: changedEmail.text,
    html: changedEmail.html
  });
}

async function register(payload) {
  const username = normalizeUsername(payload.username);
  const email = normalizeEmail(payload.email);
  logInfo("Auth register attempt", {
    username,
    email: maskEmail(email)
  });

  ensureAllowedEmailDomain(email);

  const existing = await User.findOne({
    $or: [{ username }, { email }]
  });

  if (existing) {
    if (!existing.isEmailVerified && existing.status === "pending_verification") {
      try {
        await issueVerificationCode(existing);
      } catch (error) {
        logError("Verification resend failed", {
          userId: existing.id,
          email: maskEmail(existing.email),
          message: error.message
        });
      }

      throw new AppError("Email not verified. We sent you a fresh verification code.", 409, {
        code: "email_not_verified",
        email: existing.email
      });
    }

    logInfo("Auth register rejected", {
      username,
      email: maskEmail(email),
      reason: "identity_conflict"
    });
    throw new AppError("Username or email already in use", 409);
  }

  const passwordHash = await hashPassword(payload.password);
  const user = await User.create({
    username,
    usernameDisplay: payload.username,
    email,
    passwordHash,
    status: "pending_verification",
    isEmailVerified: false
  });

  const profile = await Profile.create({
    userId: user.id,
    displayName: payload.username
  });

  const settings = await UserSettings.create({ userId: user.id });
  user.profileId = profile.id;
  user.settingsId = settings.id;
  await user.save();

  try {
    await issueVerificationCode(user);
    logInfo("Verification email sent", {
      userId: user.id,
      email: maskEmail(user.email)
    });
  } catch (error) {
    logError("Verification email failed", {
      userId: user.id,
      email: maskEmail(user.email),
      message: error.message
    });
  }

  logInfo("Auth register success", {
    userId: user.id,
    username: user.username,
    email: maskEmail(user.email),
    verificationRequired: true
  });

  return {
    verificationRequired: true,
    email: user.email,
    user: {
      id: user.id,
      username: user.username,
      usernameDisplay: user.usernameDisplay,
      email: user.email
    }
  };
}

async function verifyEmail(payload, context) {
  const email = normalizeEmail(payload.email);
  logInfo("Auth verify-email attempt", {
    email: maskEmail(email)
  });

  const authCode = await consumeAuthCode({
    email,
    code: payload.code,
    purpose: "register_verify"
  });

  const user = await User.findOne({ id: authCode.userId, email, deletedAt: null });
  if (!user) {
    throw new AppError("User not found", 404);
  }

  user.isEmailVerified = true;
  user.status = "active";
  user.modifiedAt = new Date();
  await user.save();

  const tokens = await issueTokens(user, context);

  sendWelcomeEmail(user)
    .then(() => {
      logInfo("Welcome email queued", {
        userId: user.id,
        email: maskEmail(user.email)
      });
    })
    .catch((error) => {
      logError("Welcome email failed", {
        userId: user.id,
        email: maskEmail(user.email),
        message: error.message
      });
    });

  return { user, ...tokens };
}

async function login(payload, context) {
  const identity = String(payload.identity).trim().toLowerCase();
  logInfo("Auth login attempt", {
    identity: maskIdentity(identity)
  });
  const user = await User.findOne({
    $or: [{ email: identity }, { username: identity }],
    deletedAt: null
  });

  if (!user) {
    logInfo("Auth login rejected", {
      identity: maskIdentity(identity),
      reason: "user_not_found"
    });
    throw new AppError("Invalid credentials", 401);
  }

  const isValid = await comparePassword(payload.password, user.passwordHash);
  if (!isValid) {
    logInfo("Auth login rejected", {
      identity: maskIdentity(identity),
      userId: user.id,
      reason: "invalid_password"
    });
    throw new AppError("Invalid credentials", 401);
  }

  if (!user.isEmailVerified || user.status === "pending_verification") {
    try {
      await issueVerificationCode(user);
    } catch (error) {
      logError("Verification resend failed", {
        userId: user.id,
        email: maskEmail(user.email),
        message: error.message
      });
    }

    logInfo("Auth login rejected", {
      identity: maskIdentity(identity),
      userId: user.id,
      reason: "email_not_verified"
    });
    throw new AppError("Email not verified. We sent you a fresh verification code.", 403, {
      code: "email_not_verified",
      email: user.email
    });
  }

  user.lastLoginAt = new Date();
  user.modifiedAt = new Date();
  await user.save();
  logInfo("Auth login success", {
    userId: user.id,
    username: user.username
  });

  const tokens = await issueTokens(user, context);
  return { user, ...tokens };
}

async function refreshToken(refreshToken, context) {
  if (!refreshToken) {
    logInfo("Auth refresh rejected", {
      reason: "missing_refresh_token"
    });
    throw new AppError("Refresh token is required", 401);
  }
  logInfo("Auth refresh attempt", {
    hasRefreshToken: Boolean(refreshToken)
  });

  const payload = verifyRefreshToken(refreshToken);
  const session = await authRepository.findOne({
    userId: payload.sub,
    refreshTokenHash: hashToken(refreshToken),
    isRevoked: false
  });

  if (!session) {
    logInfo("Auth refresh rejected", {
      userId: payload.sub,
      reason: "session_not_found"
    });
    throw new AppError("Refresh session not found", 401);
  }

  session.isRevoked = true;
  session.revokedAt = new Date();
  await session.save();

  const user = await User.findOne({ id: payload.sub, deletedAt: null });
  if (!user) {
    logInfo("Auth refresh rejected", {
      userId: payload.sub,
      reason: "user_not_found"
    });
    throw new AppError("User not found", 404);
  }

  logInfo("Auth refresh success", {
    userId: user.id
  });

  return issueTokens(user, context);
}

async function logout(userId, refreshToken) {
  logInfo("Auth logout attempt", {
    userId,
    hasRefreshToken: Boolean(refreshToken)
  });
  if (!refreshToken) {
    logInfo("Auth logout skipped", {
      userId,
      reason: "missing_refresh_token"
    });
    return;
  }

  await authRepository.updateOne(
    { userId, refreshTokenHash: hashToken(refreshToken), isRevoked: false },
    { isRevoked: true, revokedAt: new Date(), modifiedAt: new Date() }
  );

  logInfo("Auth logout success", {
    userId
  });
}

async function logoutAll(userId) {
  logInfo("Auth logout all attempt", {
    userId
  });
  await authRepository.revokeAllForUser(userId);
  logInfo("Auth logout all success", {
    userId
  });
}

async function me(userId) {
  logInfo("Auth me lookup", {
    userId
  });
  const user = await User.findOne({ id: userId }).lean();
  const profile = await Profile.findOne({ userId }).lean();
  const settings = await UserSettings.findOne({ userId }).lean();

  if (!user) {
    logInfo("Auth me lookup failed", {
      userId,
      reason: "user_not_found"
    });
  }

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
  const normalizedEmail = normalizeEmail(email);
  const user = await User.findOne({ email: normalizedEmail, deletedAt: null }).lean();
  logInfo("Auth forgot-password attempt", {
    email: maskEmail(normalizedEmail),
    userFound: Boolean(user)
  });

  if (!user) {
    return {
      email: normalizedEmail,
      message: `If an account exists, reset instructions for ${PRODUCT_NAME} have been sent`
    };
  }

  const { code } = await createAuthCode({
    userId: user.id,
    email: normalizedEmail,
    purpose: "reset_password",
    expirationMinutes: RESET_CODE_MINUTES
  });

  try {
    const resetEmail = buildResetPasswordEmail({
      userName: user.usernameDisplay || user.username || "there",
      resetUrl: `${env.frontendOrigin}/auth/reset-password?email=${encodeURIComponent(normalizedEmail)}`,
      supportEmail: env.mail.from,
      expirationMinutes: RESET_CODE_MINUTES
    });

    await sendMail({
      to: normalizedEmail,
      subject: resetEmail.subject,
      text: `${resetEmail.text}\nYour reset code is: ${code}`,
      html: `${resetEmail.html}<p style="margin:24px 60px 0 60px;font-size:16px;line-height:24px;color:#353534;text-align:center;"><strong>Your reset code:</strong> ${code}</p>`
    });
    logInfo("Reset email queued", {
      email: maskEmail(normalizedEmail),
      userFound: true
    });
  } catch (error) {
    logError("Reset email failed", {
      email: maskEmail(normalizedEmail),
      userFound: true,
      message: error.message
    });
  }

  return {
    email: normalizedEmail,
    message: `If an account exists, reset instructions for ${PRODUCT_NAME} have been sent`
  };
}

async function resetPassword(payload) {
  const email = normalizeEmail(payload.email);
  logInfo("Auth reset-password attempt", {
    email: maskEmail(email),
    hasCode: Boolean(payload.code)
  });

  const authCode = await consumeAuthCode({
    email,
    code: payload.code,
    purpose: "reset_password"
  });

  const user = await User.findOne({ id: authCode.userId, email, deletedAt: null });
  if (!user) {
    throw new AppError("User not found", 404);
  }

  user.passwordHash = await hashPassword(payload.password);
  user.modifiedAt = new Date();
  await user.save();
  await authRepository.revokeAllForUser(user.id);

  sendPasswordChangedEmail(user).catch((error) => {
    logError("Password changed email failed", {
      userId: user.id,
      email: maskEmail(user.email),
      message: error.message
    });
  });

  return {
    message: "Password reset successful"
  };
}

async function changePassword(userId, payload) {
  logInfo("Auth change-password attempt", {
    userId
  });

  const user = await User.findOne({ id: userId, deletedAt: null });
  if (!user) {
    throw new AppError("User not found", 404);
  }

  const isValid = await comparePassword(payload.currentPassword, user.passwordHash);
  if (!isValid) {
    throw new AppError("Current password is incorrect", 400);
  }

  user.passwordHash = await hashPassword(payload.newPassword);
  user.modifiedAt = new Date();
  await user.save();

  sendPasswordChangedEmail(user).catch((error) => {
    logError("Password changed email failed", {
      userId: user.id,
      email: maskEmail(user.email),
      message: error.message
    });
  });

  return {
    success: true
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
  verifyEmail,
  login,
  refreshToken,
  logout,
  logoutAll,
  me,
  forgotPassword,
  resetPassword,
  changePassword,
  buildCookieOptions
};
