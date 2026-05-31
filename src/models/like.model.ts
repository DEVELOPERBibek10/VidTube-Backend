import mongoose, { Schema } from "mongoose";

const likeSchema = new Schema(
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
    likableType: {
      type: String,
      enum: ["Video", "Comment"],
      required: true,
    },
  },
  { timestamps: true }
);

likeSchema.index(
  { likedBy: 1, likable: 1 },
  {
    unique: true,
  }
);

likeSchema.index({ likable: 1 });
export const Like = mongoose.model("Like", likeSchema);
