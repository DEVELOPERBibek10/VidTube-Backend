import type { MongoId } from "../id.js";

export interface IComment {
  content: string;
  video: MongoId;
  parentId: MongoId | null;
  owner: MongoId;
  likes: number;
  createdAt: Date;
  updatedAt: Date;
}
