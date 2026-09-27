import type { Response } from "express";
import { Types } from "mongoose";
import {
  createComment,
  deleteComment,
  getAllComments,
  updateComment,
} from "../services/comment.service.js";
import type { AuthTypedRequest } from "../types/request.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import type {
  CreateCommentSchema,
  CreateCommentParamsSchema,
  DeleteCommentSchema,
  EditCommentSchema,
  FetchCommentsSchema,
} from "../validators/comment.validator.js";

const addComment = asyncHandler(
  async (
    req: AuthTypedRequest<CreateCommentSchema, null, CreateCommentParamsSchema>,
    res: Response
  ) => {
    const { videoId } = req.params;
    const { content, parentComment } = req.body;

    const comment = await createComment({
      video: videoId,
      content,
      owner: req.user._id,
      ...(parentComment && { parentComment }),
    });

    return res
      .status(201)
      .json(new ApiResponse(201, comment, "Comment created successfully"));
  }
);

const fetchComments = asyncHandler(
  async (
    req: AuthTypedRequest<null, null, null, FetchCommentsSchema>,
    res: Response
  ) => {
    const { videoId, cursor, parentComment } = req.query;

    const comments = await getAllComments({
      videoId: new Types.ObjectId(videoId),
      cursor: cursor ? new Types.ObjectId(cursor) : null,
      parentComment: parentComment
        ? new Types.ObjectId(parentComment)
        : undefined,
      userId: req.user._id,
    });

    return res
      .status(200)
      .json(new ApiResponse(200, comments, "Comments fetched successfully"));
  }
);

const editComment = asyncHandler(
  async (
    req: AuthTypedRequest<
      EditCommentSchema["body"],
      null,
      EditCommentSchema["params"]
    >,
    res: Response
  ) => {
    const { commentId } = req.params;
    const { content } = req.body;

    const updatedContent = await updateComment(
      commentId,
      req.user._id,
      content
    );

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { content: updatedContent },
          "Comment updated successfully"
        )
      );
  }
);

const removeComment = asyncHandler(
  async (
    req: AuthTypedRequest<null, null, DeleteCommentSchema>,
    res: Response
  ) => {
    const { commentId } = req.params;

    if (!Types.ObjectId.isValid(commentId)) {
      throw new ApiError(400, "BAD_REQUEST", "Invalid commentId");
    }

    await deleteComment(commentId, req.user._id);

    return res
      .status(200)
      .json(new ApiResponse(200, {}, "Comment deleted successfully"));
  }
);

export { addComment, fetchComments, editComment, removeComment };
