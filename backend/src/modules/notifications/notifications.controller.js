const asyncHandler = require("../../utils/async-handler");
const { sendSuccess } = require("../../utils/response");
const notificationsService = require("./notifications.service");

const list = asyncHandler(async (req, res) => {
  const result = await notificationsService.listNotifications(req.user.id);
  return sendSuccess(res, { message: "Notifications loaded", data: result });
});

const readOne = asyncHandler(async (req, res) => {
  const result = await notificationsService.markRead(req.user.id, req.params.id);
  return sendSuccess(res, { message: "Notification marked as read", data: result });
});

const readAll = asyncHandler(async (req, res) => {
  const result = await notificationsService.markAllRead(req.user.id);
  return sendSuccess(res, { message: "All notifications marked as read", data: result });
});

module.exports = {
  list,
  readOne,
  readAll
};

