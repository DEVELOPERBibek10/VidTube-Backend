import type { Types } from "mongoose";
import { User } from "../models/user.model.js";
import mongoose from "mongoose";
import crypto from "crypto";
import getVectorEmbedding from "../utils/vectorEmbedding.js";
import { Video } from "../models/video.model.js";
import { ApiError } from "../utils/ApiError.js";
import { redisClient } from "../db/redis.js";
import { pageinationHelper } from "../utils/paginationHelper.js";

async function userSuggestions(username: string) {
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

async function userSearch(
  userId: string | Types.ObjectId,
  username?: string,
  pageToken?: string
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
  return pageinationHelper(result, limit, true);
}

async function videoTitleSuggestions(title: string) {
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
async function videoSearch(
  userId: string | Types.ObjectId,
  searchQuery?: string,
  queryHash?: string,
  page = 1
) {
  const searchHash =
    queryHash || !searchQuery
      ? queryHash
      : crypto.createHash("md5").update(searchQuery).digest("hex");
  const searchKey = `search:${userId}:${searchHash}`;
  const exists = await redisClient.exists(searchKey);
  const vectorLimit = 60;
  const start = (page - 1) * 20;
  const end = start + 19;
  let videoIds: string[] = [];

  if (exists) {
    videoIds = await redisClient.lrange(searchKey, start, end + 1);
  } else if (!exists && searchQuery) {
    const videoEmbeddig = await getVectorEmbedding(searchQuery);
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
          _id: 1,
        },
      },
    ]);
    if (videos.length === 0) {
      return {
        videos: [],
        nextCursor: "",
        hasNextPage: false,
      };
    }
    videoIds = videos.map((video) => String(video._id));
    const pipeline = redisClient
      .pipeline()
      .rpush(searchKey, ...videoIds)
      .expire(searchKey, 600);

    const result = await pipeline.exec();

    result?.forEach(([err, result], index) => {
      if (err) {
        console.error(`Redis pipeline command ${index} failed: ${err.message}`);
        throw new ApiError(
          500,
          "INTERNAL_SERVER_ERROR",
          "Unable to process search results at the moment. Please try again later."
        );
      }
    });
  } else {
    return {
      videos: [],
      nextCursor: "",
      hasNextPage: false,
    };
  }
  const areVideosLeft = videoIds.length > 20;
  if (areVideosLeft) {
    videoIds = videoIds.slice(start, end + 1);
  }
  const videos = await Video.find({
    _id: {
      $in: videoIds,
    },
  });
  if (videos.length === 0) {
    return {
      videos: [],
      nextCursor: "",
      hasNextPage: false,
    };
  }
  const cpyVideos = new Map();
  for (let video of videos) {
    cpyVideos.set(String(video._id), video);
  }
  const response = videoIds.map((id) => cpyVideos.get(id));
  return {
    videos: response,
    nextCursor: searchHash,
    hasNextPage: areVideosLeft,
  };
}

export { userSuggestions, userSearch, videoTitleSuggestions, videoSearch };
