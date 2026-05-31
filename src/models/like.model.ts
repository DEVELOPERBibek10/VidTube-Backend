import mongoose, { Schema } from "mongoose";
import { ApiError } from "../utils/ApiError.js";
import type { NextFunction } from "express";

const likeSchema = new Schema(
  {
    likedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    likableId: {
      type: Schema.Types.ObjectId,
      required: true,
    },
    likableType: {
      type: String,
      enum: ["Video", "Comment"],
      required: true,
    },
  },
  { timestamps: true }
);

likeSchema.index(
  { likedBy: 1, likableId: 1 },
  {
    unique: true,
  }
);

likeSchema.index({ likableId: 1 });
export const Like = mongoose.model("Like", likeSchema);
