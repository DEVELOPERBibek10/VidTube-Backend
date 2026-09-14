import mongoose, { Schema } from "mongoose";
import type { WatchHistoryDocument } from "../types/Services/watchHistory.js";

const watchHistorySchema = new Schema<WatchHistoryDocument>({
  user: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  video: {
    type: Schema.Types.ObjectId,
    ref: "Video",
    required: true,
  },

  watchTime: {
    type: Number,
    required: true,
  },
  watchedAt: {
    type: Date,
    default: Date.now,
  },
});

watchHistorySchema.index({ user: 1, video: 1 }, { unique: true });
watchHistorySchema.index({ user: 1, watchedAt: -1 });

export const WatchHistory = mongoose.model<WatchHistoryDocument>(
  "WatchHistory",
  watchHistorySchema
);
