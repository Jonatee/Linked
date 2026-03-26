const rateLimit = require("express-rate-limit");

function createRateLimiter(options) {
  return rateLimit({
    standardHeaders: true,
    legacyHeaders: false,
    ...options
  });
}

function getRequesterKey(req) {
  return req.user?.id || req.ip;
}

function getEmailAndIpKey(req) {
  const email =
    req.body?.email ||
    req.body?.identity ||
    req.body?.username ||
    "anonymous";

  return `${String(email).trim().toLowerCase()}::${req.ip}`;
}

const globalApiRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: "Too many requests. Please try again later."
});

const loginRateLimiter = createRateLimiter({
  windowMs: 10 * 60 * 1000,
  max: 5,
  message: "Too many login attempts. Please try again in 10 minutes."
});

const registerRateLimiter = createRateLimiter({
  windowMs: 30 * 60 * 1000,
  max: 3,
  message: "Too many registration attempts. Please try again later."
});

const forgotPasswordRateLimiter = createRateLimiter({
  windowMs: 30 * 60 * 1000,
  max: 3,
  keyGenerator: getEmailAndIpKey,
  message: "Too many password reset requests. Please try again later."
});

const verifyEmailRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 10,
  keyGenerator: getEmailAndIpKey,
  message: "Too many verification attempts. Please try again later."
});

const resetPasswordRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 5,
  keyGenerator: getEmailAndIpKey,
  message: "Too many reset attempts. Please try again later."
});

const refreshRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: "Too many refresh attempts. Please try again later."
});

const writeRateLimiter = createRateLimiter({
  windowMs: 10 * 60 * 1000,
  max: 20,
  keyGenerator: getRequesterKey,
  message: "Too many write requests. Please slow down."
});

const interactionRateLimiter = createRateLimiter({
  windowMs: 10 * 60 * 1000,
  max: 60,
  keyGenerator: getRequesterKey,
  message: "Too many interaction requests. Please slow down."
});

module.exports = {
  globalApiRateLimiter,
  loginRateLimiter,
  registerRateLimiter,
  forgotPasswordRateLimiter,
  verifyEmailRateLimiter,
  resetPasswordRateLimiter,
  refreshRateLimiter,
  writeRateLimiter,
  interactionRateLimiter,
  createRateLimiter
};
