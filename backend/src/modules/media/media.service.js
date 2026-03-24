const cloudinary = require("../../config/cloudinary");
const env = require("../../config/env");
const Media = require("./media.model");

async function signUpload(userId, payload) {
  const timestamp = Math.round(Date.now() / 1000);
  const entityFolders = {
    profile_avatar: `${env.cloudinary.uploadFolder}/users/${userId}/avatars`,
    profile_banner: `${env.cloudinary.uploadFolder}/users/${userId}/banners`,
    post: `${env.cloudinary.uploadFolder}/users/${userId}/posts`,
    comment: `${env.cloudinary.uploadFolder}/users/${userId}/comments`
  };
  const folder =
    payload.folder ||
    entityFolders[payload.attachedEntityType] ||
    `${env.cloudinary.uploadFolder}/users/${userId}/misc`;
  const paramsToSign = { folder, timestamp };
  const signature = cloudinary.utils.api_sign_request(paramsToSign, env.cloudinary.apiSecret);

  return {
    cloudName: env.cloudinary.cloudName,
    apiKey: env.cloudinary.apiKey,
    timestamp,
    folder,
    signature
  };
}

async function confirmUpload(userId, payload) {
  return Media.create({
    ownerId: userId,
    type: payload.type,
    resourceType: payload.type,
    publicId: payload.publicId,
    version: String(payload.version || ""),
    format: payload.format,
    bytes: payload.bytes || 0,
    width: payload.width || null,
    height: payload.height || null,
    duration: payload.duration || null,
    secureUrl: payload.secureUrl,
    thumbnailUrl: payload.thumbnailUrl || payload.secureUrl,
    folder: payload.folder || "",
    attachedEntityType: payload.attachedEntityType || null,
    attachedEntityId: payload.attachedEntityId || null,
    altText: payload.altText || "",
    usageStatus: payload.attachedEntityId ? "attached" : "temp"
  });
}

async function deleteMedia(userId, id) {
  await Media.findOneAndUpdate(
    { id, ownerId: userId, deletedAt: null },
    { usageStatus: "deleted", deletedAt: new Date(), modifiedAt: new Date() },
    { new: true }
  );

  return { success: true };
}

module.exports = {
  signUpload,
  confirmUpload,
  deleteMedia
};
