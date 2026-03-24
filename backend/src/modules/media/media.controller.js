const asyncHandler = require("../../utils/async-handler");
const { sendSuccess } = require("../../utils/response");
const mediaService = require("./media.service");

const signUpload = asyncHandler(async (req, res) => {
  const result = await mediaService.signUpload(req.user.id, req.body);
  return sendSuccess(res, { message: "Upload signature generated", data: result });
});

const confirmUpload = asyncHandler(async (req, res) => {
  const result = await mediaService.confirmUpload(req.user.id, req.body);
  return sendSuccess(res, { statusCode: 201, message: "Media confirmed", data: result });
});

const removeMedia = asyncHandler(async (req, res) => {
  const result = await mediaService.deleteMedia(req.user.id, req.params.id);
  return sendSuccess(res, { message: "Media removed", data: result });
});

module.exports = {
  signUpload,
  confirmUpload,
  removeMedia
};

