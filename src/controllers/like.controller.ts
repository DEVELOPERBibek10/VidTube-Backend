import type { Response } from "express";
import {
  toggleCommentLike,
  toggleVideoLike,
} from "../services/like.service.js";
import type { AuthTypedRequest } from "../types/request.js";
import { likeableType } from "../types/Model/Like.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import type {
  CommentLikeSchema,
  VideoLikeSchema,
} from "../validators/like.validator.js";

const toggleLikeOnVideo = asyncHandler(
  async (req: AuthTypedRequest<null, null, VideoLikeSchema>, res: Response) => {
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
  }
);

const toggleLikeOnComment = asyncHandler(
  async (
    req: AuthTypedRequest<null, null, CommentLikeSchema>,
    res: Response
  ) => {
    const { commentId } = req.params;

    const result = await toggleCommentLike(
      req.user._id,
      commentId,
      likeableType.comment
    );

    return res
      .status(200)
      .json(
        new ApiResponse(200, result, "Comment like status updated successfully")
      );
  }
);

export { toggleLikeOnVideo, toggleLikeOnComment };
