import type { Types } from "mongoose";
import { Video } from "../models/video.model.js";
import { ApiError } from "../utils/ApiError.js";
import { Like } from "../models/like.model.js";
import { likeableType as LikeableType } from "../types/Model/Like.js";
import mongoose from "mongoose";
import { Comment } from "../models/comment.model.js";

class LikeService {
  private async likeToggle(
    userId: string | Types.ObjectId,
    likableId: string | Types.ObjectId,
    likableType: LikeableType
  ) {
    const like = await Like.deleteOne({
      likedBy: userId,
      likable: likableId,
      likeableType: likableType,
    });

    if (like.deletedCount == 0) {
      try {
        await Like.create({
          likedBy: userId,
          likable: likableId,
          likeableType: likableType,
        });
        return { success: true, likeStatus: "Liked" };
      } catch (error) {
        if (
          error instanceof mongoose.mongo.MongoServerError &&
          error.code === 11000
        ) {
          return { success: true, likeStatus: "Liked" };
        }
        throw error;
      }
    }
    return {
      success: true,
      likeStatus: "Unliked",
    };
  }

  async toggleVideoLike(
    userId: string | Types.ObjectId,
    videoId: string | Types.ObjectId,
    likeableType: LikeableType.video
  ) {
    const isExistant = await Video.exists({ _id: videoId });
    if (!isExistant) {
      throw new ApiError(404, "VIDEO_NOT_FOUND", "Please like a valid video");
    }

    const response = await this.likeToggle(userId, videoId, likeableType);
    return response;
  }

  async toggleCommentLike(
    userId: string | Types.ObjectId,
    commentId: string | Types.ObjectId,
    likeableType: LikeableType.comment
  ) {
    const isExistant = await Comment.exists({ _id: commentId });
    if (!isExistant) {
      throw new ApiError(
        404,
        "COMMENT_NOT_FOUND",
        "Please like a valid comment"
      );
    }

    const response = await this.likeToggle(userId, commentId, likeableType);
    return response;
  }
}

export const likeService = new LikeService();
