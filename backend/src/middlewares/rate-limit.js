const rateLimit = require("express-rate-limit");

function createRateLimiter(options) {
  return rateLimit({
    standardHeaders: true,
    legacyHeaders: false,
    ...options
  });
}

const authRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: "Too many authentication attempts"
});

const writeRateLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 60,
  message: "Too many write requests"
});

module.exports = {
  authRateLimiter,
  writeRateLimiter,
  createRateLimiter
};

