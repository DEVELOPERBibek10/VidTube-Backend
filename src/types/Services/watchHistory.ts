import type mongoose from "mongoose";

export interface WatchHistoryDocument {
  _id: string;
  user: mongoose.Types.ObjectId;
  video: mongoose.Types.ObjectId;
  watchTime: number;
  watchedAt: Date;
}
