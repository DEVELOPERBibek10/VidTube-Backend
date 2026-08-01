import type { Document } from "mongoose";
import type mongoose from "mongoose";

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
  title_embedding: number[];
  createdAt: Date;
  updatedAt: Date;
}
