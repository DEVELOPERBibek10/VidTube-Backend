import { Video } from "../models/video.model.js";
import { ApiError } from "../utils/ApiError.js";
import { Like } from "../models/like.model.js";
import { likeableType as LikeableType } from "../types/Model/Like.js";
import { Comment } from "../models/comment.model.js";
import type { MongoId } from "../types/id.js";
import { executeTransaction } from "../utils/executeTransaction.js";

type LikeToggleResponse = {
  success: boolean;
  likeStatus: "Liked" | "Unliked";
  likeCount?: number;
};

async function likeToggle(
  userId: MongoId,
  likableId: MongoId,
  likableType: LikeableType
): Promise<LikeToggleResponse> {
  return await executeTransaction(async (session) => {
    const unlike = await Like.deleteOne({
      likedBy: userId,
      likable: likableId,
      likeableType: likableType,
    }).session(session);

    if (unlike.deletedCount == 0) {
      await Like.create(
        [
          {
            likedBy: userId,
            likable: likableId,
            likeableType: likableType,
          },
        ],
        { session }
      );
      const target =
        likableType === LikeableType.video
          ? await Video.updateOne(
              { _id: likableId },
              { $inc: { likeCount: 1 } }
            ).session(session)
          : await Comment.updateOne(
              { _id: likableId },
              { $inc: { likeCount: 1 } }
            ).session(session);

      return {
        success: true,
        likeStatus: "Liked",
        likeCount: target.modifiedCount,
      };
    } else {
      const target =
        likableType === LikeableType.video
          ? await Video.updateOne(
              { _id: likableId, likes: { $gt: 0 } },
              { $inc: { likeCount: -1 } }
            ).session(session)
          : await Comment.updateOne(
              { _id: likableId, likes: { $gt: 0 } },
              { $inc: { likeCount: -1 } }
            ).session(session);

      return {
        success: true,
        likeStatus: "Unliked",
        likeCount: target.modifiedCount,
      };
    }
  });
}

async function toggleVideoLike(
  userId: MongoId,
  videoId: MongoId,
  likeableType: LikeableType.video
) {
  const isExistant = await Video.exists({ _id: videoId });
  if (!isExistant) {
    throw new ApiError(404, "VIDEO_NOT_FOUND", "Please like a valid video");
  }

  const response = await likeToggle(userId, videoId, likeableType);
  return response;
}

async function toggleCommentLike(
  userId: MongoId,
  commentId: MongoId,
  likeableType: LikeableType.comment
) {
  const isExistant = await Comment.exists({ _id: commentId });
  if (!isExistant) {
    throw new ApiError(404, "COMMENT_NOT_FOUND", "Please like a valid comment");
  }

  const response = await likeToggle(userId, commentId, likeableType);
  return response;
}

export { toggleVideoLike, toggleCommentLike };
