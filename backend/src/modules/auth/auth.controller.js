const asyncHandler = require("../../utils/async-handler");
const { sendSuccess } = require("../../utils/response");
const authService = require("./auth.service");
const env = require("../../config/env");

function authContext(req) {
  return {
    userAgent: req.headers["user-agent"],
    ipAddress: req.ip
  };
}

const register = asyncHandler(async (req, res) => {
  const result = await authService.register(req.body, authContext(req));
  res.cookie(env.refreshCookieName, result.refreshToken, authService.buildCookieOptions());
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
  const result = await authService.login(req.body, authContext(req));
  res.cookie(env.refreshCookieName, result.refreshToken, authService.buildCookieOptions());
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
  const result = await authService.refreshToken(token, authContext(req));
  res.cookie(env.refreshCookieName, result.refreshToken, authService.buildCookieOptions());
  return sendSuccess(res, {
    message: "Token refreshed",
    data: { accessToken: result.accessToken }
  });
});

const logout = asyncHandler(async (req, res) => {
  await authService.logout(req.user.id, req.cookies[env.refreshCookieName]);
  res.clearCookie(env.refreshCookieName);
  return sendSuccess(res, { message: "Logged out" });
});

const logoutAll = asyncHandler(async (req, res) => {
  await authService.logoutAll(req.user.id);
  res.clearCookie(env.refreshCookieName);
  return sendSuccess(res, { message: "Logged out from all sessions" });
});

const forgotPassword = asyncHandler(async (req, res) => {
  const result = await authService.forgotPassword(req.body.email);
  return sendSuccess(res, { message: "Forgot password requested", data: result });
});

const resetPassword = asyncHandler(async (req, res) => {
  const result = await authService.resetPassword(req.body);
  return sendSuccess(res, { message: "Password reset completed", data: result });
});

const me = asyncHandler(async (req, res) => {
  const result = await authService.me(req.user.id);
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

