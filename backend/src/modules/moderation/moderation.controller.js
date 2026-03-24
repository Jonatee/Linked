const asyncHandler = require("../../utils/async-handler");
const { sendSuccess } = require("../../utils/response");
const moderationService = require("./moderation.service");

const createReport = asyncHandler(async (req, res) => {
  const result = await moderationService.createReport(req.user.id, req.body);
  return sendSuccess(res, { statusCode: 201, message: "Report submitted", data: result });
});

const listReports = asyncHandler(async (req, res) => {
  const result = await moderationService.listReports();
  return sendSuccess(res, { message: "Reports loaded", data: result });
});

const updateReport = asyncHandler(async (req, res) => {
  const result = await moderationService.updateReport(req.params.id, req.user.id, req.body);
  return sendSuccess(res, { message: "Report updated", data: result });
});

const createAction = asyncHandler(async (req, res) => {
  const result = await moderationService.createAction(req.user.id, req.body);
  return sendSuccess(res, { statusCode: 201, message: "Moderation action recorded", data: result });
});

module.exports = {
  createReport,
  listReports,
  updateReport,
  createAction
};

