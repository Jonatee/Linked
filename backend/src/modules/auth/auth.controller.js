const asyncHandler = require("../../utils/async-handler");
const { sendSuccess } = require("../../utils/response");
const authService = require("./auth.service");
const env = require("../../config/env");
const { logInfo } = require("../../config/logger");

function authContext(req) {
  return {
    userAgent: req.headers["user-agent"],
    ipAddress: req.ip
  };
}

function maskEmail(email = "") {
  const [local, domain] = String(email).split("@");
  if (!local || !domain) {
    return email;
  }

  return `${local.slice(0, 2)}***@${domain}`;
}

const register = asyncHandler(async (req, res) => {
  logInfo("Auth controller register request", {
    username: req.body?.username || null,
    emailProvided: Boolean(req.body?.email)
  });
  const result = await authService.register(req.body, authContext(req));
  res.cookie(env.refreshCookieName, result.refreshToken, authService.buildCookieOptions());
  logInfo("Auth controller register response", {
    userId: result.user.id
  });
  return sendSuccess(res, {
    statusCode: 201,
    message: "Registration successful",
    data: {
      user: result.user,
      accessToken: result.accessToken
    }
  });
});

const login = asyncHandler(async (req, res) => {
  logInfo("Auth controller login request", {
    identityProvided: Boolean(req.body?.identity)
  });
  const result = await authService.login(req.body, authContext(req));
  res.cookie(env.refreshCookieName, result.refreshToken, authService.buildCookieOptions());
  logInfo("Auth controller login response", {
    userId: result.user.id
  });
  return sendSuccess(res, {
    message: "Login successful",
    data: {
      user: result.user,
      accessToken: result.accessToken
    }
  });
});

const refresh = asyncHandler(async (req, res) => {
  const token = req.body.refreshToken || req.cookies[env.refreshCookieName];
  logInfo("Auth controller refresh request", {
    hasBodyRefreshToken: Boolean(req.body?.refreshToken),
    hasCookieRefreshToken: Boolean(req.cookies?.[env.refreshCookieName])
  });
  const result = await authService.refreshToken(token, authContext(req));
  res.cookie(env.refreshCookieName, result.refreshToken, authService.buildCookieOptions());
  logInfo("Auth controller refresh response", {
    accessTokenIssued: Boolean(result.accessToken)
  });
  return sendSuccess(res, {
    message: "Token refreshed",
    data: { accessToken: result.accessToken }
  });
});

const logout = asyncHandler(async (req, res) => {
  logInfo("Auth controller logout request", {
    userId: req.user?.id || null,
    hasCookieRefreshToken: Boolean(req.cookies?.[env.refreshCookieName])
  });
  await authService.logout(req.user.id, req.cookies[env.refreshCookieName]);
  res.clearCookie(env.refreshCookieName);
  logInfo("Auth controller logout response", {
    userId: req.user.id
  });
  return sendSuccess(res, { message: "Logged out" });
});

const logoutAll = asyncHandler(async (req, res) => {
  logInfo("Auth controller logout-all request", {
    userId: req.user?.id || null
  });
  await authService.logoutAll(req.user.id);
  res.clearCookie(env.refreshCookieName);
  logInfo("Auth controller logout-all response", {
    userId: req.user.id
  });
  return sendSuccess(res, { message: "Logged out from all sessions" });
});

const forgotPassword = asyncHandler(async (req, res) => {
  logInfo("Auth controller forgot-password request", {
    emailProvided: Boolean(req.body?.email)
  });
  const result = await authService.forgotPassword(req.body.email);
  logInfo("Auth controller forgot-password response", {
    email: maskEmail(result.email)
  });
  return sendSuccess(res, { message: "Forgot password requested", data: result });
});

const resetPassword = asyncHandler(async (req, res) => {
  logInfo("Auth controller reset-password request", {
    hasToken: Boolean(req.body?.token),
    hasPassword: Boolean(req.body?.password)
  });
  const result = await authService.resetPassword(req.body);
  logInfo("Auth controller reset-password response");
  return sendSuccess(res, { message: "Password reset completed", data: result });
});

const me = asyncHandler(async (req, res) => {
  logInfo("Auth controller me request", {
    userId: req.user?.id || null
  });
  const result = await authService.me(req.user.id);
  logInfo("Auth controller me response", {
    userId: req.user.id,
    hasProfile: Boolean(result.profile)
  });
  return sendSuccess(res, { message: "Current user loaded", data: result });
});

module.exports = {
  register,
  login,
  refresh,
  logout,
  logoutAll,
  forgotPassword,
  resetPassword,
  me
};
