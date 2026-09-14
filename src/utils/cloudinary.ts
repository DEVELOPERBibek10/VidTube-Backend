import { v2 as cloudinary } from "cloudinary";
import type { UploadApiResponse, UploadApiOptions } from "cloudinary";
import fs from "fs";
import { ApiError } from "./ApiError.js";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadFile = async (
  localFilePath: string,
  publicId?: string
): Promise<UploadApiResponse> => {
  const options: UploadApiOptions = {
    invalidate: true,
    secure: true,
    resource_type: "image",
    overwrite: false,
  };

  if (publicId!.trim()) {
    options.public_id = publicId!.trim();
    options.overwrite = true;
  }

  try {
    const response = await cloudinary.uploader.upload(localFilePath, options);

    return response;
  } catch (error: unknown) {
    if (error instanceof Error && "http_code" in error) {
      console.error("CLOUDINARY ERROR:", error);
      if (!error.http_code) {
        throw new ApiError(
          503,
          "NETWORK_ERROR",
          "Could not connect to Cloud Service."
        );
      }

      if (error.http_code === 400) {
        throw new ApiError(
          400,
          "INVALID_UPLOAD_PARAMS",
          `Cloudinary Upload Rejected: ${error.message}`
        );
      }
      if ((error.http_code as number) >= 500) {
        throw new ApiError(
          502,
          "EXT_STORAGE_DOWN",
          "Cloudinary servers are experiencing issues."
        );
      }
    }
    console.error("Unexpected Cloudinary Error:", error);
    throw new ApiError(
      500,
      "INTERNAL_SERVER_ERROR",
      "Not able to upload the file."
    );
  } finally {
    try {
      await fs.promises.unlink(localFilePath);
    } catch (err) {
      console.error("Cleanup Error (Local file removal failed):", err);
    }
  }
};

const deleteFile = async (publicId: string, resourceType: string = "image"): Promise<void> => {
  try {
    await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
      invalidate: true,
    });
  } catch (error: unknown) {
    if (error instanceof Error && "http_code" in error) {
      console.error("CLOUDINARY ERROR:", error);
      if (error.http_code === 400 || error.http_code === 401) {
        throw new ApiError(
          400,
          "INVALID_DELETE_REQ",
          `Cloudinary Deletion Failed: ${error.message}`
        );
      }
    }
    console.error("Unexpected Cloudinary Error:", error);
    throw new ApiError(
      502,
      "STORAGE_SERVICE_UNAVAILABLE",
      "Cloudinary is unreachable. Deletion aborted."
    );
  }
};

export { uploadFile, deleteFile };
