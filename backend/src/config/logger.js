const morgan = require("morgan");

const requestLogger = morgan("dev");

function logInfo(message, meta) {
  console.log(`[INFO] ${message}`, meta || "");
}

function logError(message, meta) {
  console.error(`[ERROR] ${message}`, meta || "");
}

module.exports = {
  requestLogger,
  logInfo,
  logError
};

