function sendSuccess(res, { statusCode = 200, message = "OK", data = null, meta = null }) {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
    meta,
    error: null
  });
}

function sendError(res, { statusCode = 500, message = "Internal server error", details = null }) {
  return res.status(statusCode).json({
    success: false,
    message,
    data: null,
    meta: null,
    error: details
  });
}

module.exports = {
  sendSuccess,
  sendError
};

