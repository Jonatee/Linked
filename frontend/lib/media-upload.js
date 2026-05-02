import axios from "axios";
import api from "@/lib/api";

function getResourceType(file) {
  return file.type.startsWith("video/") ? "video" : "image";
}

export async function uploadMediaFile(file, attachedEntityType = "post", options = {}) {
  const type = getResourceType(file);
  const onProgress = typeof options.onProgress === "function" ? options.onProgress : null;
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

  const uploadResponse = await axios.post(
    `https://api.cloudinary.com/v1_1/${cloudName}/${type}/upload`,
    uploadFormData,
    {
      headers: {
        "Content-Type": "multipart/form-data"
      },
      onUploadProgress: (event) => {
        if (!onProgress || !event.total) {
          return;
        }

        const percent = Math.min(100, Math.max(1, Math.round((event.loaded / event.total) * 100)));
        onProgress(percent);
      }
    }
  );

  const uploaded = uploadResponse.data;
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

  if (onProgress) {
    onProgress(100);
  }

  return confirmResponse.data.data;
}
