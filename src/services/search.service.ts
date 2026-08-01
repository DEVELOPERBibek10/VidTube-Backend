import type { Types } from "mongoose";
import { User } from "../models/user.model.js";
import mongoose from "mongoose";
import crypto from "crypto";
import getVectorEmbedding from "../utils/vectorEmbedding.js";
import { Video } from "../models/video.model.js";
import { ApiError } from "../utils/ApiError.js";
import { redisClient } from "../db/redis.js";

class SearchService {
  async userSuggestions(username: string) {
    const users = await User.aggregate([
      {
        $search: {
          index: "UserSearch",
          autocomplete: {
            query: username,
            path: "username",
            tokenOrder: "sequential",
            fuzzy: {
              maxEdits: 2,
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
          username: 1,
          score: { $meta: "searchScore" },
        },
      },
      { $limit: 10 },
    ]);

    const results = users.length !== 0 ? users.map((res) => res.username) : [];

    return results;
  }

  async userSearch(
    userId: string | Types.ObjectId,
    username: string,
    pageToken: string | null
  ) {
    const limit = 15;
    const result = await User.aggregate([
      {
        $search: {
          index: "UserSearch",
          text: {
            query: username,
            path: "username",
          },
          searchAfter: pageToken,
        },
      },
      {
        $limit: limit + 1,
      },
      {
        $lookup: {
          from: "subcriptions",
          localField: "_id",
          foreignField: "channel",
          as: "subscribers",
        },
      },
      {
        $addFields: {
          subscriberCount: {
            $size: "$subscribers",
          },
          isSubscribed: {
            $cond: {
              if: {
                $in: [
                  new mongoose.Types.ObjectId(userId),
                  "$subscribers.subscriber",
                ],
              },
              then: true,
              else: false,
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
          username: 1,
          avatar: {
            url: 1,
          },
          subscriberCount: 1,
          isSubscribed: 1,
          paginationToken: { $meta: "searchSequenceToken" },
          score: { $meta: "searchScore" },
        },
      },
    ]);
    if (!result) return [];
    const areVideosLeft = result.length > limit;
    const users = result.slice(0, limit);
    let response: {
      users: any[];
      nextCursor: string | null;
      hasNextPage: boolean;
    } = {
      users: [...users],
      nextCursor: areVideosLeft
        ? users[users.length - 1].paginationToken
        : null,
      hasNextPage: areVideosLeft,
    };

    return response;
  }

  async videoSuggestions(title: string) {
    const videos = await Video.aggregate([
      {
        $search: {
          index: "title_index",
          autocomplete: {
            query: title,
            path: "title",
            tokenOrder: "sequential",
            fuzzy: {
              maxEdits: 2,
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
          title: 1,
          score: { $meta: "searchScore" },
        },
      },
      { $limit: 10 },
    ]);

    const results = videos.length !== 0 ? videos.map((res) => res.title) : [];

    return results;
  }
  async videoSearch(
    userId: string | Types.ObjectId,
    title: string,
    queryHash?: string,
    page = 1
  ) {
    const searchHash =
      queryHash || !title
        ? queryHash
        : crypto.createHash("md5").update(title).digest("hex");
    const searchKey = `search:${userId}:${searchHash}`;
    const exists = await redisClient.exists(searchKey);
    const vectorLimit = 60;
    const start = (page - 1) * 20;
    const end = start + 19;
    let videoIds: string[] | Types.ObjectId[] = [];

    if (exists) {
      videoIds = await redisClient.lrange(searchKey, start, end + 1);
    } else if (!exists && title) {
      const videoEmbeddig = await getVectorEmbedding(title);
      const videos = await Video.aggregate([
        {
          $vectorSearch: {
            index: "video_title_index",
            path: "title_embedding",
            queryVector: videoEmbeddig,
            numCandidates: vectorLimit * 10,
            limit: vectorLimit,
            filter: { isPublished: { $eq: true } },
          },
        },

        {
          $project: {
            title: 0,
            description: 0,
            thumbnail: 0,
            videoFile: 0,
            isPublished: 0,
            duration: 0,
            views: 0,
            owner: 0,
          },
        },
      ]);
      if (videos.length === 0) {
        return [];
      }
      videoIds = videos.map((video) => String(video._id));
      const pipeline = redisClient
        .pipeline()
        .rpush(searchKey, ...videoIds)
        .expire(searchKey, 600);

      const result = await pipeline.exec();

      result?.forEach(([err, result], index) => {
        if (err) {
          console.error(
            `Redis pipeline command ${index} failed: ${err.message}`
          );
          throw new ApiError(
            500,
            "INTERNAL_SERVER_ERROR",
            "Unable to process search results at the moment. Please try again later."
          );
        }
      });
    } else {
      throw new ApiError(
        400,
        "MISSING_REQUIRED_FIELD",
        "Please provide a title or queryHash to search for videos."
      );
    }
    const areVideosLeft = videoIds.length > 20;
    if (areVideosLeft) {
      videoIds = videoIds.slice(0, 20);
    }
    const videos = await Video.find({
      _id: {
        $in: videoIds,
      },
    });
    if (!videos) throw new ApiError(404, "NOT_FOUND", "Videos not found.");
    const cpyVideos = new Map();
    for (let video of videos) {
      cpyVideos.set(String(video._id), video);
    }
    const response = videoIds.map((id) => cpyVideos.get(id));
    return {
      videos: response,
      paginationToken: searchHash,
      hasNextPage: areVideosLeft,
    };
  }
}

export const searchService = new SearchService();
