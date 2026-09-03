import type { VideoUploadSchema } from "../../validators/video.validator.js";
import type { MongoId } from "../id.js";

export interface VideoUpload extends VideoUploadSchema {
  owner: MongoId;
  thumbnailLocalPath: string;
}

export interface VideoUpdate {
  title?: string;
  description?: string;
  isPublished?: boolean;
}
