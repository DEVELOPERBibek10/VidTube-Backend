import { type Types } from "mongoose";

export interface IComment {
  content: string;
  video: Types.ObjectId;
  parentId: Types.ObjectId | null;
  owner: Types.ObjectId;
  likes: number;
  createdAt: Date;
  updatedAt: Date;
}
