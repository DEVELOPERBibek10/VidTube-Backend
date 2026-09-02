import type { Types } from "mongoose";
import { WatchHistory } from "../models/watchHistory.model.js";
import mongoose from "mongoose";
import type { MongoId } from "../types/id.js";
import { pageinationHelper } from "../utils/paginationHelper.js";

async function createHistory(
  userId: string | Types.ObjectId,
  videoId: string | Types.ObjectId,
  watchTime: number
) {
  await WatchHistory.findOneAndUpdate(
    { user: userId, video: videoId },
    { $set: { watchTime, watchedAt: Date.now() } },
    { upsert: true, new: true, runValidators: true }
  );
}

async function getWatchHistory(
  userId: string | Types.ObjectId,
  historyId?: MongoId | null
) {
  const pipeline: any[] = [];
  const limit = 15;

  if (historyId) {
    pipeline.push({
      $match: {
        user: new mongoose.Types.ObjectId(userId),
        _id: { $lt: new mongoose.Types.ObjectId(historyId) },
      },
    });
  } else {
    pipeline.push({
      $match: {
        user: new mongoose.Types.ObjectId(userId),
      },
    });
  }

  pipeline.push(
    {
      $sort: { watchedAt: -1 },
    },
    { $limit: limit + 1 },
    {
      $lookup: {
        from: "videos",
        localField: "video",
        foreignField: "_id",
        as: "videos",
        pipeline: [
          { $match: { isPublished: true } },
          {
            $lookup: {
              from: "users",
              localField: "owner",
              as: "owner",
              foreignField: "_id",
              pipeline: [
                {
                  $project: {
                    avatar: 1,
                    username: 1,
                  },
                },
              ],
            },
          },
          {
            $addFields: {
              owner: { $first: "$owner" },
            },
          },
          {
            $project: {
              title: 1,
              duration: 1,
              views: 1,
              videoFile: 1,
              thumbnail: 1,
              owner: 1,
            },
          },
        ],
      },
    }
  );
  const history = await WatchHistory.aggregate(pipeline);

  return pageinationHelper(history, limit, false);
}

async function deleteHistory(historyId: string | Types.ObjectId) {
  await WatchHistory.findOneAndDelete({ _id: historyId });
}

async function clearHistory(userId: string | Types.ObjectId) {
  await WatchHistory.deleteMany({ user: userId });
}

export { createHistory, getWatchHistory, deleteHistory, clearHistory };
