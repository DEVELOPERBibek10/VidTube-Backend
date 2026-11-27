import { Video } from "../models/video.model.js";
import { ApiError } from "../utils/ApiError.js";
import { Like } from "../models/like.model.js";
import { likeableType as LikeableType } from "../types/Model/Like.js";
import { Comment } from "../models/comment.model.js";
import { executeTransaction } from "../utils/executeTransaction.js";

type LikeToggleResponse = {
  likeStatus: "Liked" | "Unliked";
};

async function likeToggle(
  userId: string,
  likableId: string,
  likableType: LikeableType
): Promise<LikeToggleResponse> {
  return await executeTransaction<LikeToggleResponse>(async (session) => {
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

      if (likableType === LikeableType.video) {
        await Video.updateOne(
          { _id: likableId },
          { $inc: { likes: 1 } }
        ).session(session);
      } else {
        await Comment.updateOne(
          { _id: likableId },
          { $inc: { likes: 1 } }
        ).session(session);
      }

      return {
        likeStatus: "Liked",
      };
    }

    if (likableType === LikeableType.video) {
      await Video.updateOne(
        { _id: likableId, likes: { $gte: 0 } },
        { $inc: { likes: -1 } }
      ).session(session);
    } else {
      await Comment.updateOne(
        { _id: likableId, likes: { $gte: 0 } },
        { $inc: { likes: -1 } }
      ).session(session);
    }

    return {
      likeStatus: "Unliked",
    };
  });
}

async function toggleVideoLike(
  userId: string,
  videoId: string,
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
  userId: string,
  commentId: string,
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
