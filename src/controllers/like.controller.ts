import type { Response } from "express";
import {
  toggleCommentLike,
  toggleVideoLike,
} from "../services/like.service.js";
import type { AuthTypedRequest, EmptyObject } from "../types/request.js";
import { likeableType } from "../types/Model/Like.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import type {
  CommentLikeSchema,
  VideoLikeSchema,
} from "../validators/like.validator.js";
import { MongoErrorLabel, MongoServerError } from "mongodb";
import { ApiError } from "../utils/ApiError.js";

const toggleLikeOnVideo = asyncHandler(
  async (
    req: AuthTypedRequest<EmptyObject, undefined, VideoLikeSchema>,
    res: Response
  ) => {
    try {
      const { videoId } = req.params;

      const result = await toggleVideoLike(
        req.user._id,
        videoId,
        likeableType.video
      );

      return res
        .status(200)
        .json(
          new ApiResponse(200, result, "Video like status updated successfully")
        );
    } catch (error) {
      if (
        error instanceof MongoServerError &&
        error.hasErrorLabel(MongoErrorLabel.TransientTransactionError)
      ) {
        throw new ApiError(
          503,
          "LIKE_FAILED",
          "Unable to like this video. Please try again."
        );
      }

      throw error;
    }
  }
);

const toggleLikeOnComment = asyncHandler(
  async (
    req: AuthTypedRequest<EmptyObject, undefined, CommentLikeSchema>,
    res: Response
  ) => {
    try {
      const { commentId } = req.params;

      const result = await toggleCommentLike(
        req.user._id,
        commentId,
        likeableType.comment
      );

      return res
        .status(200)
        .json(
          new ApiResponse(
            200,
            result,
            "Comment like status updated successfully"
          )
        );
    } catch (error) {
      if (
        error instanceof MongoServerError &&
        error.hasErrorLabel(MongoErrorLabel.TransientTransactionError)
      ) {
        throw new ApiError(
          503,
          "LIKE_FAILED",
          "Unable to like this comment. Please try again."
        );
      }

      throw error;
    }
  }
);

export { toggleLikeOnVideo, toggleLikeOnComment };
