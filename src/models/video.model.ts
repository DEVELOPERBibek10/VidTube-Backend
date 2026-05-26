import mongoose, { Schema } from "mongoose";
import type { IVideo } from "../types/Model/Video.js";

const videoSchema = new Schema<IVideo>(
  {
    videoFile: {
      url: {
        type: String,
        required: true,
      },
      publicId: {
        type: String,
        required: true,
      },
    },
    thumbnail: {
      url: {
        type: String,
        required: true,
      },
      publicId: {
        type: String,
        required: true,
      },
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    duration: {
      type: Number,
      required: true,
    },
    views: {
      type: Number,
      default: 0,
    },
    isPublished: {
      type: Boolean,
      default: true,
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },
    title_embedding: {
      type: [Number],
      default: [],
    },
  },
  { timestamps: true }
);

export const Video = mongoose.model<IVideo>("Video", videoSchema);
