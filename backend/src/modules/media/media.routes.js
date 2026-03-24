const express = require("express");
const validate = require("../../validators/validate");
const { requireAuth } = require("../../middlewares/auth");
const controller = require("./media.controller");
const validation = require("./media.validation");

const router = express.Router();

router.post("/sign-upload", requireAuth, validate(validation.signUploadSchema), controller.signUpload);
router.post("/confirm-upload", requireAuth, validate(validation.confirmUploadSchema), controller.confirmUpload);
router.delete("/:id", requireAuth, controller.removeMedia);

module.exports = router;

