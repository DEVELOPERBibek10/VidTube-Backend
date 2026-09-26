import { Comment } from "../models/comment.model.js";
import { Like } from "../models/like.model.js";
import { Playlist } from "../models/playlist.model.js";
import { WatchHistory } from "../models/watchHistory.model.js";
import type { MongoId } from "../types/id.js";

const BATCH_SIZE = 1000;
const BATCH_DELAY_MS = 2500;

function wait(duration: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, duration));
}

async function cleanUp(deletionId: MongoId): Promise<void> {
  // TODO: Add progress tracking to skip the wait if the deletion is already complete or to retry if it fails.
  while (true) {
    const [likes, comments, watchHistories, playlists] = await Promise.all([
      Like.find({ likable: deletionId }, { _id: 1 }).limit(BATCH_SIZE).lean(),
      Comment.find({ video: deletionId }, { _id: 1 }).limit(BATCH_SIZE).lean(),
      WatchHistory.find({ video: deletionId }, { _id: 1 })
        .limit(BATCH_SIZE)
        .lean(),
      Playlist.find({ videos: deletionId }, { _id: 1 })
        .limit(BATCH_SIZE)
        .lean(),
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
        { videos: { $in: playlistIds } },
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
  // TODO: Add progress tracking for media deletion to skip the wait if the deletion is completed or to retry if it fails.
}

export default cleanUp;
