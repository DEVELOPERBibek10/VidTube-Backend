import type mongoose from "mongoose";

export enum VideoDeletionStatus {
  NOT_DELETED = "not_deleted",
  PENDING = "pending",
  IN_PROGRESS = "in_progress",
  FAILED = "failed",
}

export interface IVideo {
  videoFile: {
    url: string;
    publicId: string;
  };
  thumbnail: {
    url: string;
    publicId: string;
  };
  title: string;
  description: string;
  duration: number;
  views: number;
  isPublished: boolean;
  owner: mongoose.Types.ObjectId;
  likes: number;
  comments: number;
  isDeleted: boolean;
  deletionStatus: VideoDeletionStatus;
  title_embedding: number[];
  createdAt: Date;
  updatedAt: Date;
}
