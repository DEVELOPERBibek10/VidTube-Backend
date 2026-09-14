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

export interface VideoDocument {
  _id: MongoId;
  title: string;
  description: string;
  duration: number;
  views: number;
  isPublished: boolean;
  owner: MongoId;
  likes: number;
  comments: number;
  videoFile: { url: string; publicId: string };
  thumbnail: { url: string; publicId: string };
  createdAt: Date;
  updatedAt: Date;
  creator?: {
    username: string;
    avatar: { url: string; publicId: string };
    subscribers: number;
  };
  isLiked?: boolean;
  isSubscribed?: boolean;
  watchTime?: number | null;
}
