import mongoose, { Schema } from "mongoose";

const watchHistorySchema = new Schema({
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

export const WatchHistory = mongoose.model("WatchHistory", watchHistorySchema);
