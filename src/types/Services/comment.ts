import type { MongoId } from "../id.js";

export type CreateComment = {
  content: string;
  video: MongoId;
  parentComment?: MongoId;
  owner: MongoId;
};

export type UpdateComment = {
  content: string;
};

export type GetAllCommentsBase = {
  userId: MongoId;
  videoId: MongoId;
  cursor: MongoId | null; // The cursor is the ID of the last comment fetched in the previous request
};

export type GetAllComments = GetAllCommentsBase &
  ({ parentComment: MongoId } | { parentComment?: never });
