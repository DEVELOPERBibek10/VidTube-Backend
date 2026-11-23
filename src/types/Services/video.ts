import type { VideoUploadSchema } from "../../validators/video.validator.js";

export interface VideoUpload extends VideoUploadSchema {
  owner: string;
  thumbnailLocalPath: string;
}

export interface VideoUpdate {
  title?: string;
  description?: string;
  isPublished?: boolean;
}

export interface VideoDocument {
  _id: string;
  title: string;
  description: string;
  duration: number;
  views: number;
  isPublished: boolean;
  owner: string;
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

export interface PaginatedVideoDocument {
  _id: string;
  title: string;
  description: string;
  duration: number;
  views: number;
  creator?: {
    username: string;
    avatar: { url: string; publicId: string };
  };
  videoFile: { url: string; publicId: string };
  thumbnail: { url: string; publicId: string };
  createdAt: Date;
  updatedAt: Date;
}
