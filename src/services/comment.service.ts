import { Types } from "mongoose";
import { Comment } from "../models/comment.model.js";
import type { IComment } from "../types/Model/Comment.js";
import type {
  CreateComment,
  GetAllComments,
} from "../types/Services/comment.js";
import { ApiError } from "../utils/ApiError.js";
import { pageinationHelper } from "../utils/paginationHelper.js";
import type { MongoId } from "../types/id.js";

async function createComment(commentData: CreateComment): Promise<IComment> {
  const comment = await Comment.create(commentData);
  if (!comment) {
    throw new ApiError(
      500,
      "COMMENT_CREATION_FAILED",
      "Failed to create comment"
    );
  }
  return comment;
}

async function getAllComments(commentQuery: GetAllComments) {
  const { videoId, cursor, parentComment, userId } = commentQuery;
  const limit = 6;
  const pipeline: any[] = [];

  if (!cursor && !parentComment && videoId) {
    // It is for fetching top-level comments without pagination
    pipeline.push({
      $match: {
        video: new Types.ObjectId(videoId),
      },
    });
  } else if (cursor && !parentComment && videoId) {
    // It is for top-level comment with pagination
    pipeline.push({
      $match: {
        video: new Types.ObjectId(videoId),
        _id: { $lt: new Types.ObjectId(cursor) },
      },
    });
  } else if (!cursor && parentComment && videoId) {
    // It is for fetching replies without pagination
    pipeline.push({
      $match: {
        video: new Types.ObjectId(videoId),
        parentComment: new Types.ObjectId(parentComment),
      },
    });
  } else if (cursor && parentComment && videoId) {
    // It is for replies with pagination
    pipeline.push({
      $match: {
        video: new Types.ObjectId(videoId),
        parentComment: new Types.ObjectId(parentComment),
        _id: { $lt: new Types.ObjectId(cursor) },
      },
    });
  }

  pipeline.push(
    {
      $sort: { createdAt: -1 },
    },
    { $limit: limit + 1 },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "commentBy",
        pipeline: [
          {
            $project: {
              _id: 1,
              username: 1,
              avatar: 1,
            },
          },
        ],
      },
    },
    {
      $lookup: {
        from: "likes",
        localField: "_id",
        foreignField: "likeable",
        as: "likes",
        pipeline: [
          {
            $match: {
              likeableType: "Comment",
            },
          },
          {
            $project: {
              _id: 1,
              likedBy: 1,
            },
          },
        ],
      },
    },
    {
      $addFields: {
        likesCount: { $size: "$likes" },
        isLiked: {
          $cond: {
            if: {
              $in: [new Types.ObjectId(userId), "$likes.likedBy"],
            },
            then: true,
            else: false,
          },
        },
        commentBy: { $first: "$commentBy" },
      },
    },
    {
      $project: {
        _id: 1,
        content: 1,
        likesCount: 1,
        isLiked: 1,
        commentBy: 1,
        parentComment: 1,
      },
    }
  );
  const comments = await Comment.aggregate(pipeline);
  return pageinationHelper(comments, limit, false);
}

async function updateComment(
  commentId: MongoId,
  userId: MongoId,
  content: string
): Promise<string> {
  const comment = await Comment.findOneAndUpdate(
    { _id: commentId, owner: userId },
    { content },
    { new: true }
  );
  if (!comment) {
    throw new ApiError(
      404,
      "COMMENT_NOT_FOUND",
      "Comment not found or you are not the owner of the comment"
    );
  }
  return comment.content;
}

async function deleteComment(
  commentId: MongoId,
  userId: MongoId
): Promise<{ success: boolean }> {
  const comment = await Comment.findOneAndDelete({
    _id: commentId,
    owner: userId,
  });
  if (!comment) {
    throw new ApiError(
      404,
      "COMMENT_NOT_FOUND",
      "Comment not found or you are not the owner of the comment"
    );
  }
  return { success: true };
}

export { createComment, getAllComments, updateComment, deleteComment };
