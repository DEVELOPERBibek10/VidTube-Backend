import { v2 as cloudinary } from "cloudinary";
import { ApiError } from "../utils/ApiError.js";
import type { VideoUpdate, VideoUpload } from "../types/Services/video.js";
import { deleteFile, uploadFile } from "../utils/cloudinary.js";
import { Video } from "../models/video.model.js";
import type { Types } from "mongoose";
import mongoose from "mongoose";
import { redisClient } from "../db/redis.js";
import { WatchHistory } from "../models/watchHistory.model.js";
import { pageinationHelper } from "../utils/paginationHelper.js";
import type { MongoId } from "../types/id.js";

async function getSignature() {
  const folder = "vidtube/videos";
  const timestamp = Math.round(new Date().getTime() / 1000);

  const signature = cloudinary.utils.api_sign_request(
    { folder, timestamp },
    process.env.CLOUDINARY_API_SECRET!
  );

  if (signature.length === 0) {
    throw new ApiError(
      500,
      "INTERNAL_SERVER_ERROR",
      "Failed to generate the video signature"
    );
  }
  return { signature, timestamp, folder };
}

async function upload(videoDoc: VideoUpload) {
  const {
    title,
    description,
    owner,
    isPublished,
    videoUrl,
    videoPublicId,
    duration,
    thumbnailLocalPath,
  } = videoDoc;
  const thumbnail = await uploadFile(thumbnailLocalPath);

  try {
    const video = await Video.create({
      title,
      description,
      owner,
      isPublished,
      videoFile: {
        url: videoUrl,
        publicId: videoPublicId,
      },
      thumbnail: {
        url: thumbnail.url,
        publicId: thumbnail.public_id,
      },
      duration,
    });

    const createdVideo = {
      title: video.title,
      description: video.description,
      isPublished: video.isPublished,
      videoFile: {
        url: video.videoFile.url,
        publicId: video.videoFile.publicId,
      },
      thumbnail: {
        url: video.thumbnail.url,
        publicId: video.thumbnail.publicId,
      },
      duration: video.duration,
    };

    return createdVideo;
  } catch (error: any) {
    const response = await Promise.allSettled([
      deleteFile(thumbnail.public_id),
      deleteFile(videoPublicId, "video"),
    ]);
    if (response[0].status === "rejected") {
      console.error(`Thumbnai deleteion failed: ${response[0].reason}`);
    }
    if (response[1].status === "rejected") {
      console.error(`Video deleteion failed: ${response[1].reason}`);
    }
    if (
      response[0].status === "rejected" &&
      response[1].status === "rejected"
    ) {
      console.error(
        `Deleteion failed: ${response[0].reason}, ${response[1].reason}`
      );
    }
    throw error;
  }
}

async function updateVideoInfo(
  videoId: string | Types.ObjectId,
  owner: string | Types.ObjectId,
  updateData: VideoUpdate
) {
  const { title, description, isPublished } = updateData;

  if (!mongoose.Types.ObjectId.isValid(videoId)) {
    throw new ApiError(
      400,
      "INVALID_VIDEO_ID",
      "The provided video ID is invalid."
    );
  }

  if (title) {
    updateData.title = title;
  }
  if (description) updateData.description = description;

  if (isPublished) updateData.isPublished = isPublished;

  const updatedVideoDetail = await Video.findOneAndUpdate(
    { _id: videoId, owner: owner },
    {
      $set: updateData,
    },
    { new: true }
  );

  if (!updatedVideoDetail || !updatedVideoDetail._id) {
    throw new ApiError(404, "NOT_FOUND", "Video not found or unauthorized");
  }

  return updatedVideoDetail;
}

async function reviseThumbnail(
  videoId: string | Types.ObjectId,
  userId: string | Types.ObjectId
) {
  const video = await Video.findById(videoId)
    .select("thumbnail.publicId thumbnail.url")
    .lean();

  if (!video) {
    throw new ApiError(
      404,
      "NOT_FOUND",
      "Video not found to update thumbnail."
    );
  }

  const thumbnail = await uploadFile(
    video.thumbnail.url,
    video.thumbnail.publicId
  );

  const updatedVideo = await Video.findOneAndUpdate(
    {
      _id: videoId,
      owner: userId,
    },
    {
      $set: {
        "thumbnail.url": thumbnail.secure_url,
        "thumbnail.publicId": thumbnail.public_id,
      },
    },
    { new: true }
  );

  if (!updatedVideo) {
    throw new ApiError(404, "NOT_FOUND", "Video not found or unauthorized");
  }

  return updatedVideo;
}

async function removeVideo(
  videoId: string | Types.ObjectId,
  owner: string | Types.ObjectId
) {
  const video = await Video.findById({
    _id: videoId,
    owner,
  });

  if (!video) {
    throw new ApiError(404, "NOT_FOUND", "Video not found");
  }

  const response = await Promise.allSettled([
    deleteFile(video.thumbnail.publicId),
    deleteFile(video.videoFile.publicId, "video"),
  ]);
  const failedDeletions = response
    .filter((result) => result.status === "rejected")
    .map((result) => {
      console.log("Deletion failed: ", result.reason);
      return result.reason;
    });

  if (failedDeletions.length > 0) {
    const hasClientError = failedDeletions.some(
      (err) => err.statusCode === 400
    );
    throw new ApiError(
      hasClientError ? 400 : 502,
      hasClientError
        ? "ASSET_DELETION_MALFORMED"
        : "STORAGE_SERVICE_UNAVAILABLE",
      "Video deletion aborted due to asset clearance failure.",
      failedDeletions
    );
  }

  await Video.findOneAndDelete({
    _id: videoId,
    owner,
  });
}

async function getVideo(
  videoId: string | Types.ObjectId,
  userId: string | Types.ObjectId
) {
  const cachedVideo = await redisClient.get(`video:${videoId}`);
  if (cachedVideo) {
    return JSON.parse(cachedVideo);
  }
  const videoResult = Video.aggregate([
    {
      $match: { _id: new mongoose.Types.ObjectId(videoId), isPublished: true },
    },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "creator",
        pipeline: [
          {
            $project: {
              username: 1,
              avatar: 1,
              subscribers: 1,
            },
          },
        ],
      },
    },
    { $unwind: "$creator" },
    {
      $lookup: {
        from: "subscriptions",
        localField: "owner",
        foreignField: "channel",
        as: "subscribers",
        pipeline: [
          {
            $project: { subscriber: 1 },
          },
        ],
      },
    },
    {
      $addFields: {
        isLiked: {
          $cond: {
            if: {
              $in: [new mongoose.Types.ObjectId(userId), "$likes.likedBy"],
            },
            then: true,
            else: false,
          },
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
        videoFile: 1,
        title: 1,
        description: 1,
        duration: 1,
        views: 1,
        creator: 1,
        videoLikeSchema: 1,
        comments: 1,
        subscribers: 1,
        isLiked: 1,
        isSubscribed: 1,
        createdAt: 1,
      },
    },
  ]);

  const watchHistory = WatchHistory.findOne({ user: userId, video: videoId });

  let [video, history] = await Promise.all([videoResult, watchHistory]);

  if (!video || video.length === 0) {
    throw new ApiError(404, "NOT_FOUND", "Video not found");
  }

  const videoDoc = video[0];

  const response = {
    ...videoDoc,
    watchTime: history ? history.watchTime : null,
  };
  await redisClient.set(
    `video:${videoDoc._id}`,
    JSON.stringify(response),
    "PX",
    21600
  );
  return response;
}

async function getEveryVideo(videoId?: MongoId, userId?: MongoId) {
  const pipeline: any[] = [];
  const limit = 15;

  if (videoId) {
    pipeline.push({
      $match: {
        isPublished: true,
        _id: { $lt: new mongoose.Types.ObjectId(videoId) },
      },
    });
  } else if (userId) {
    pipeline.push({
      $match: {
        isPublished: true,
        owner: new mongoose.Types.ObjectId(userId),
      },
    });
  } else if (videoId && userId) {
    pipeline.push({
      $match: {
        isPublished: true,
        owner: new mongoose.Types.ObjectId(userId),
        _id: { $lt: new mongoose.Types.ObjectId(videoId) },
      },
    });
  } else {
    pipeline.push({
      $match: {
        isPublished: true,
      },
    });
  }

  pipeline.push(
    { $sort: { views: -1 } },
    {
      $limit: limit + 1,
    },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "creator",
        pipeline: [
          {
            $project: {
              username: 1,
              avatar: 1,
            },
          },
        ],
      },
    },
    { $unwind: "$creator" },
    {
      $project: {
        videoFile: 1,
        thumbnail: 1,
        title: 1,
        duration: 1,
        views: 1,
        creator: 1,
        createdAt: 1,
        updatedAt: 1,
      },
    }
  );

  const videos = await Video.aggregate(pipeline);

  return pageinationHelper(videos, limit, false);
}

export {
  getSignature,
  upload,
  updateVideoInfo,
  reviseThumbnail,
  removeVideo,
  getVideo,
  getEveryVideo,
};
