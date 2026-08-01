import type { Types } from "mongoose";

export type CreateComment = {
  content: string;
  video: Types.ObjectId | string;
  parentComment?: Types.ObjectId | string;
};

export type UpdateComment = {
  content: string;
};
