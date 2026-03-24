const { sendError } = require("../utils/response");
const { logError } = require("../config/logger");

function errorHandler(error, req, res, next) {
  const statusCode = error.statusCode || 500;

  logError(error.message, error.details || error.stack);

  return sendError(res, {
    statusCode,
    message: error.message || "Internal server error",
    details: error.details || null
  });
}

module.exports = errorHandler;

