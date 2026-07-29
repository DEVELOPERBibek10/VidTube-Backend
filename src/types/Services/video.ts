import type { Types } from "mongoose";
import type { VideoUploadSchema } from "../../validators/video.validator.js";
import type { RequireAtLeastOne } from "../../utils/requiredAtLeasetOne.js";

export interface VideoUpload extends VideoUploadSchema {
  owner: string | Types.ObjectId;
  thumbnailLocalPath: string;
}

export interface VideoUpdate {
  title?: string;
  description?: string;
  isPublished?: boolean;
}

export type UpdateConfigWithRequired = RequireAtLeastOne<VideoUpdate>;
