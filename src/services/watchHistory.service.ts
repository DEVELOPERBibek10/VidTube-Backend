import type { Types } from "mongoose";
import { WatchHistory } from "../models/watchHistory.model.js";
import { ApiError } from "../utils/ApiError.js";
import mongoose from "mongoose";

class WatchHistoryService {
  async createHistory(
    userId: string | Types.ObjectId,
    videoId: string | Types.ObjectId,
    watchTime: number
  ) {
    await WatchHistory.findOneAndUpdate(
      { user: userId, video: videoId },
      { $set: { watchTime, watchedAt: Date.now() } },
      { upsert: true, new: true }
    );
  }

  async getWatchHistory(
    userId: string | Types.ObjectId,
    historyId?: string | Types.ObjectId | null
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

    if (history.length === 0) {
      throw new ApiError(404, "NOT_FOUND", "User's watch history not found");
    }

    const hasNextPage = history.length > limit;
    const finalHistory = history.slice(0, limit);
    let response: {
      history: any[];
      nextCursor: string | null;
      hasNextPage: boolean;
    } = {
      history: [...history],
      nextCursor: hasNextPage
        ? finalHistory[finalHistory.length - 1]._id
        : null,
      hasNextPage,
    };
    return response;
  }

  async deleteHistory(historyId: string | Types.ObjectId) {
    await WatchHistory.findOneAndDelete({ _id: historyId });
  }

  async clearHistory(userId: string | Types.ObjectId) {
    await WatchHistory.deleteMany({ user: userId });
  }
}

export const watchHistoryService = new WatchHistoryService();
