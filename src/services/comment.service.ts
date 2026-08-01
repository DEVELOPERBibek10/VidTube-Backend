import mongoose from "mongoose";
import { Comment } from "../models/comment.model.js";
import type { IComment } from "../types/Model/Comment.js";
import type { CreateComment } from "../types/Services/comment.js";

class CommentService {
  async createComment(commentData: CreateComment): Promise<IComment> {
    const comment = await Comment.create(commentData);
    return comment;
  }

  async getAllCommentsForVideo(videoId: string): Promise<IComment[]> {
    const comments = await Comment.aggregate([
      {
        $match: { video: new mongoose.Types.ObjectId(videoId) },
      },
      {
        $lookup: {
          from: "users",
          localField: "owner",
          foreignField: "_id",
          as: "owner",
        },
      },
      {
        $unwind: "$owner",
      },
      // Like statistics can be added here.
      // Reply comments count can be added here.
      {
        $project: {
          _id: 1,
          content: 1,
          owner: {
            _id: 1,
            username: 1,
            avatar: 1,
          },
        },
      },
    ]);
    return comments[0] || [];
  }

  async getReplyComments(parentCommentId: string): Promise<IComment[]> {
    const comments = await Comment.aggregate([
      {
        $match: { parentComment: new mongoose.Types.ObjectId(parentCommentId) },
      },
      {
        $lookup: {
          from: "users",
          localField: "owner",
          foreignField: "_id",
          as: "owner",
        },
      },
      {
        $unwind: "$owner",
      },
      // Like statistics can be added here.
      // Reply comments count can be added here.
      {
        $project: {
          _id: 1,
          content: 1,
          owner: {
            _id: 1,
            username: 1,
            avatar: 1,
          },
        },
      },
    ]);
    return comments[0] || [];
  }
}
export const commentService = new CommentService();
