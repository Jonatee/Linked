const AppError = require("../utils/app-error");
const { verifyAccessToken } = require("../utils/tokens");
const User = require("../modules/users/user.model");

async function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

    if (!token) {
      return next(new AppError("Authentication required", 401));
    }

    const payload = verifyAccessToken(token);
    const user = await User.findOne({ id: payload.sub, deletedAt: null });

    if (!user) {
      return next(new AppError("User not found", 401));
    }

    req.user = user;
    return next();
  } catch (error) {
    return next(new AppError("Invalid or expired token", 401));
  }
}

async function optionalAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

    if (!token) {
      return next();
    }

    const payload = verifyAccessToken(token);
    const user = await User.findOne({ id: payload.sub, deletedAt: null });

    if (user) {
      req.user = user;
    }

    return next();
  } catch (error) {
    return next();
  }
}

function requireRole(...roles) {
  return function roleGuard(req, res, next) {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new AppError("Forbidden", 403));
    }

    return next();
  };
}

module.exports = {
  requireAuth,
  optionalAuth,
  requireRole
};
