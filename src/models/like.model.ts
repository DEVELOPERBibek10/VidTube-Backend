import mongoose, { Schema } from "mongoose";
import type { LikeSchema } from "../types/Model/Like.js";
import { likeableType as LikeableType } from "../types/Model/Like.js";

const likeSchema = new Schema<LikeSchema>(
  {
    likedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    likable: {
      type: Schema.Types.ObjectId,
      required: true,
    },
    likeableType: {
      type: String,
      enum: Object.values(LikeableType),
      required: true,
    },
  },
  { timestamps: true }
);

likeSchema.index(
  { likedBy: 1, likable: 1, likeableType: 1 },
  {
    unique: true,
  }
);

likeSchema.index({ likable: 1, likeableType: 1 });
export const Like = mongoose.model("Like", likeSchema);
