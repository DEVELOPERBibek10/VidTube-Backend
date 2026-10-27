import { Comment } from "../models/comment.model.js";
import { Like } from "../models/like.model.js";
import { Playlist } from "../models/playlist.model.js";
import { Video } from "../models/video.model.js";
import { WatchHistory } from "../models/watchHistory.model.js";
import type { MongoId } from "../types/id.js";
import { likeableType } from "../types/Model/Like.js";
import { deleteVideoFromCloudinary } from "../utils/cloudinary.js";

type cleanUpIds = {
  videoId: MongoId;
  mediaId: {
    videoPublicId: string;
    thumbnailPublicId: string;
  };
};

const BATCH_SIZE = 1000;
const BATCH_DELAY_MS = 2000;

function wait(duration: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, duration));
}

async function cleanUp(deletionId: cleanUpIds): Promise<void> {
  const { videoId } = deletionId;
  const { videoPublicId, thumbnailPublicId } = deletionId.mediaId;
  await deleteVideoFromCloudinary(videoPublicId, thumbnailPublicId);
  while (true) {
    const [likes, comments, watchHistories, playlists] = await Promise.all([
      Like.find(
        { likable: videoId, likeableType: likeableType.video },
        { _id: 1 }
      )
        .limit(BATCH_SIZE)
        .lean(),
      Comment.find({ video: videoId }, { _id: 1 }).limit(BATCH_SIZE).lean(),
      WatchHistory.find({ video: videoId }, { _id: 1 })
        .limit(BATCH_SIZE)
        .lean(),
      Playlist.find({ videos: videoId }, { _id: 1 }).limit(BATCH_SIZE).lean(),
    ]);
    if (
      likes.length === 0 &&
      comments.length === 0 &&
      watchHistories.length === 0 &&
      playlists.length === 0
    ) {
      break;
    }
    const likeIds = likes.map((like) => like._id);
    const commentIds = comments.map((comment) => comment._id);
    const watchHistoryIds = watchHistories.map(
      (watchHistory) => watchHistory._id
    );
    const playlistIds = playlists.map((playlist) => playlist._id);
    await Promise.all([
      Like.deleteMany({ _id: { $in: likeIds } }),
      Comment.deleteMany({ _id: { $in: commentIds } }),
      WatchHistory.deleteMany({ _id: { $in: watchHistoryIds } }),
      Playlist.updateMany(
        { _id: { $in: playlistIds } },
        { $pull: { videos: deletionId } }
      ),
    ]);

    if (
      likes.length === BATCH_SIZE ||
      comments.length === BATCH_SIZE ||
      watchHistories.length === BATCH_SIZE ||
      playlists.length === BATCH_SIZE
    ) {
      await wait(BATCH_DELAY_MS);
    }
  }
  await Video.findByIdAndDelete(deletionId);
}

export default cleanUp;
