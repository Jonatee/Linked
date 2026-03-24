import api from "@/lib/api";

function getResourceType(file) {
  return file.type.startsWith("video/") ? "video" : "image";
}

export async function uploadMediaFile(file, attachedEntityType = "post") {
  const type = getResourceType(file);
  const signResponse = await api.post("/media/sign-upload", {
    type,
    attachedEntityType
  });

  const { cloudName, apiKey, timestamp, folder, signature } = signResponse.data.data;
  const uploadFormData = new FormData();
  uploadFormData.append("file", file);
  uploadFormData.append("api_key", apiKey);
  uploadFormData.append("timestamp", String(timestamp));
  uploadFormData.append("folder", folder);
  uploadFormData.append("signature", signature);

  const uploadResponse = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/${type}/upload`, {
    method: "POST",
    body: uploadFormData
  });

  if (!uploadResponse.ok) {
    let detail = "";

    try {
      const errorPayload = await uploadResponse.json();
      detail = errorPayload?.error?.message || JSON.stringify(errorPayload);
    } catch (error) {
      try {
        detail = await uploadResponse.text();
      } catch (innerError) {
        detail = "";
      }
    }

    throw new Error(
      detail
        ? `Cloudinary upload failed (${uploadResponse.status}): ${detail}`
        : `Cloudinary upload failed (${uploadResponse.status})`
    );
  }

  const uploaded = await uploadResponse.json();
  const confirmResponse = await api.post("/media/confirm-upload", {
    type,
    publicId: uploaded.public_id,
    version: uploaded.version,
    format: uploaded.format,
    bytes: uploaded.bytes,
    width: uploaded.width || null,
    height: uploaded.height || null,
    duration: uploaded.duration || null,
    secureUrl: uploaded.secure_url,
    thumbnailUrl: uploaded.secure_url,
    folder: uploaded.folder || folder,
    attachedEntityType,
    attachedEntityId: null,
    altText: file.name
  });

  return confirmResponse.data.data;
}
