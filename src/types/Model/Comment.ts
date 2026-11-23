import type mongoose from "mongoose";

export interface IComment {
  content: string;
  video: mongoose.Types.ObjectId;
  parentId: mongoose.Types.ObjectId | null;
  owner: mongoose.Types.ObjectId;
  likes: number;
  createdAt: Date;
  updatedAt: Date;
}
