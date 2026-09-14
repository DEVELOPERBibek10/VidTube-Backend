import type { MongoId } from "../id.js";

export interface WatchHistoryDocument {
  _id: MongoId;
  user: MongoId;
  video: MongoId;
  watchTime: number;
  watchedAt: Date;
}
