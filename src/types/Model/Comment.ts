import { type Types } from "mongoose";

export interface IComment {
  content: string;
  video: Types.ObjectId;
  parentComment: Types.ObjectId | null;
  owner: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}
