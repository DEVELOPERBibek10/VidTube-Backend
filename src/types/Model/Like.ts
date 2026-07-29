import type { Types } from "mongoose";

export enum likeableType {
  video = "Video",
  comment = "Comment",
}

export type LikeSchema = {
  likedBy: Types.ObjectId | string;
  likable: Types.ObjectId | string;
  likeableType: likeableType;
};
