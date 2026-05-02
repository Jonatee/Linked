const asyncHandler = require("../../utils/async-handler");
const { sendSuccess } = require("../../utils/response");
const AppError = require("../../utils/app-error");
const DeviceToken = require("./device-token.model");

const register = asyncHandler(async (req, res) => {
  const { token, platform = "android" } = req.body;
  if (!token) throw new AppError("token is required", 400);

  await DeviceToken.deleteMany({ token, userId: { $ne: req.user.id } });
  await DeviceToken.findOneAndUpdate(
    { userId: req.user.id, token },
    { userId: req.user.id, token, platform },
    { upsert: true, new: true }
  );

  sendSuccess(res, { message: "Device token registered" });
});

const remove = asyncHandler(async (req, res) => {
  const { token } = req.body;
  if (!token) throw new AppError("token is required", 400);

  await DeviceToken.deleteOne({ userId: req.user.id, token });
  sendSuccess(res, { message: "Device token removed" });
});

module.exports = { register, remove };
