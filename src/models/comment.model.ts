import mongoose, { Schema } from "mongoose";
import type { IComment } from "../types/Model/Comment.js";

const commentSchema = new Schema<IComment>(
  {
    content: {
      type: String,
      required: true,
    },
    video: {
      type: Schema.Types.ObjectId,
      ref: "Video",
    },
    parentId: {
      type: Schema.Types.ObjectId,
      default: null,
      ref: "Comment",
    },
    likes: {
      type: Number,
      default: 0,
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);
commentSchema.index({ video: 1, parentId: 1 });
commentSchema.index({ parentId: 1 });
export const Comment = mongoose.model<IComment>("Comment", commentSchema);
