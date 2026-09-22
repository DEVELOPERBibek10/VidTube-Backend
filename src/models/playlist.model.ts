import mongoose, { Schema } from "mongoose";

const playlistSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    isPublished: {
      type: Boolean,
      default: false,
    },
    videos: [
      {
        type: Schema.Types.ObjectId,
        ref: "Video",
      },
    ],
  },
  { timestamps: true }
);
playlistSchema.index({ videos: 1 }, { unique: true });
playlistSchema.index({ owner: 1 });
playlistSchema.index({ videos: 1 });
export const Playlist = mongoose.model("Playlist", playlistSchema);
