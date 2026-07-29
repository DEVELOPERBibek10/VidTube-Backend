import { v2 as cloudinary } from "cloudinary";
import { asyncHandler } from "../utils/asyncHandler.js";
import { type Response } from "express";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import type { AuthTypedRequest } from "../types/request.js";
import { Video } from "../models/video.model.js";
import { deleteFile, uploadFile } from "../utils/cloudinary.js";
import mongoose from "mongoose";
import getVectorEmbedding from "../utils/vectorEmbedding.js";
import type {
  UpdateVideoParamsSchema,
  UpdateVideoSchema,
  VideoQuerySchema,
  VideoUploadSchema,
} from "../validators/video.validator.js";
import { Types } from "mongoose";

const getVideoSignature = asyncHandler(
  async (req: AuthTypedRequest, res: Response) => {
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

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          signature,
          timestamp,
          folder,
          cloudName: process.env.CLOUDINARY_CLOUD_NAME,
          apiKey: process.env.CLOUDINARY_API_KEY,
        },
        "Video signature generated sucessfully"
      )
    );
  }
);

const uploadVideo = asyncHandler(
  async (req: AuthTypedRequest<VideoUploadSchema>, res: Response) => {
    const {
      title,
      description,
      isPublished,
      videoUrl,
      videoPublicId,
      duration,
    } = req.body;

    const thumbnailLocalPath = req.file?.path;

    if (!thumbnailLocalPath)
      throw new ApiError(
        400,
        "MISSING_REQUIRED_FIELD",
        "Thumbnail is required"
      );

    const thumbnail = await uploadFile(thumbnailLocalPath);

    try {
      const video = await Video.create({
        title,
        description,
        owner: req.user._id,
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

      return res
        .status(201)
        .json(
          new ApiResponse(201, createdVideo, "Video uploaded Sucessfully.")
        );
    } catch (error: any) {
      const response = await Promise.allSettled([
        deleteFile(thumbnail.public_id),
        deleteFile(videoPublicId, "video"),
      ]);
      if (
        response[0].status === "rejected" &&
        response[1].status === "rejected"
      ) {
        console.error(
          `Deleteion failed: ${response[0].reason}, ${response[1].reason}`
        );
      }
      if (response[0].status === "rejected") {
        console.error(`Thumbnai deleteion failed: ${response[0].reason}`);
      }
      if (response[1].status === "rejected") {
        console.error(`Video deleteion failed: ${response[1].reason}`);
      }
      throw error;
    }
  }
);

const updateVideoDetails = asyncHandler(
  async (
    req: AuthTypedRequest<UpdateVideoSchema, null, UpdateVideoParamsSchema>,
    res: Response
  ) => {
    const { title, description, isPublished } = req.body;
    const { videoId } = req.params;
    const updateData: any = {};

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
      { _id: videoId, owner: req.user._id },
      {
        $set: updateData,
      },
      { new: true }
    );

    if (!updatedVideoDetail || !updatedVideoDetail._id) {
      throw new ApiError(404, "NOT_FOUND", "Video not found or unauthorized");
    }

    return res
      .status(200)
      .json(
        new ApiResponse(200, updatedVideoDetail, "Details updated sucessfully")
      );
  }
);

const updateThumbnail = asyncHandler(
  async (
    req: AuthTypedRequest<null, any, UpdateVideoParamsSchema>,
    res: Response
  ) => {
    const { videoId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(videoId)) {
      throw new ApiError(
        400,
        "INVALID_VIDEO_ID",
        "The provided video ID is invalid."
      );
    }

    const thumbnailLocalPath = req.file?.path;

    if (!thumbnailLocalPath) {
      throw new ApiError(
        400,
        "MISSING_REQUIRED_FIELD",
        "Thumbnail is a required field"
      );
    }

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
        owner: req.user._id,
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

    return res
      .send(200)
      .json(
        new ApiResponse(200, updatedVideo, "Thumbnail updated sucessfully")
      );
  }
);

const deleteVideo = asyncHandler(
  async (
    req: AuthTypedRequest<null, null, UpdateVideoParamsSchema>,
    res: Response
  ) => {
    const { videoId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(videoId)) {
      throw new ApiError(
        400,
        "INVALID_VIDEO_ID",
        "The provided video ID is invalid."
      );
    }

    const video = await Video.findById({
      _id: videoId,
      owner: req.user._id,
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
      owner: req.user._id,
    });

    return res
      .status(200)
      .json(new ApiResponse(200, {}, "Video deleted Sucessfully"));
  }
);

export const getVideo = asyncHandler(
  async (
    req: AuthTypedRequest<null, null, UpdateVideoParamsSchema>,
    res: Response
  ) => {
    const { videoId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(videoId)) {
      throw new ApiError(
        400,
        "INVALID_VIDEO_ID",
        "The provided video ID is invalid."
      );
    }
    const userId = req.user._id;
    const videoResult = await Video.aggregate([
      { $match: { _id: new mongoose.Types.ObjectId(videoId) } },
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
        $lookup: {
          from: "likes",
          localField: "_id",
          foreignField: "likable",
          as: "likes",
          pipeline: [
            {
              $match: {
                likableType: "Video",
              },
            },

            {
              $project: {
                likedBy: 1,
              },
            },
          ],
        },
      },
      {
        $lookup: {
          from: "comments",
          localField: "_id",
          foreignField: "video",
          as: "comments",
          pipeline: [
            {
              $project: { _id: 1 },
            },
          ],
        },
      },
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
          likesCount: { $size: "$likes" },
          commentsCount: { $size: "$comments" },
          subscriberCount: { $size: "$subscribers" },

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
          likesCount: 1,
          commentsCount: 1,
          subscriberCount: 1,
          isLiked: 1,
          isSubscribed: 1,
          createdAt: 1,
        },
      },
    ]);

    if (!videoResult.length)
      throw new ApiError(404, "NOT_FOUND", "Video not found");

    const video = videoResult[0];

    return res
      .status(200)
      .json(new ApiResponse(200, video, "Video details fetched successfully"));
  }
);

const getAllVideos = asyncHandler(
  async (
    req: AuthTypedRequest<any, any, any, VideoQuerySchema>,
    res: Response
  ) => {
    const { page, cursor, searchText } = req.query;
    const limit = 15;
    const vectorLimit = page ? page * limit : limit;
    const pipeline: any[] = [];

    if (cursor && !mongoose.Types.ObjectId.isValid(cursor)) {
      throw new ApiError(
        400,
        "INVALID_CURSOR",
        "The provided cursor is invalid."
      );
    }

    if (searchText) {
      const queryVector = await getVectorEmbedding(searchText as string);

      pipeline.push({
        $vectorSearch: {
          index: "video_title_index",
          path: "title_embedding",
          queryVector: queryVector,
          numCandidates: vectorLimit * 10,
          limit: vectorLimit,
          filter: { isPublished: { $eq: true } },
        },
      });
    } else {
      if (!cursor) {
        pipeline.push(
          { $match: { isPublished: true } },
          { $sort: { createdAt: -1, views: -1 } }
        );
      } else {
        pipeline.push(
          {
            $match: {
              isPublished: true,
              _id: { $lt: new Types.ObjectId(cursor) },
            },
          },
          { $sort: { createdAt: -1, views: -1 } }
        );
      }
    }

    pipeline.push(
      { $limit: limit + 1 },
      {
        $lookup: {
          from: "users",
          localField: "owner",
          foreignField: "_id",
          as: "owner",
          pipeline: [
            {
              $project: {
                _id: 0,
                username: 1,
                avatar: 1,
              },
            },
          ],
        },
      },
      { $unwind: "$owner" }
    );

    const result = await Video.aggregate(pipeline);

    if (!result)
      throw new ApiError(404, "NOT_FOUND", "No videos found or unauthorized");
    const areVideosLeft = result.length > limit;
    const videos = result.slice(0, limit);
    let response: {
      videos: any[];
      nextCursor?: string | null;
      hasNextPage?: boolean;
    } = { videos: [...videos] };

    if (!searchText) {
      response.nextCursor = areVideosLeft
        ? videos[videos.length - 1]._id
        : null;
    } else {
      response.hasNextPage = areVideosLeft;
    }

    res
      .status(200)
      .json(new ApiResponse(200, response, "Videos fetched successfully"));
  }
);

const getSuggestions = asyncHandler(
  async (req: AuthTypedRequest, res: Response) => {
    const searchQuery = req.query.q || "";

    if (!searchQuery) {
      return res.status(200).json([]);
    }

    const suggestions = await Video.aggregate([
      { $match: { isPublished: true } },
      {
        $search: {
          index: "default",
          autocomplete: {
            query: searchQuery,
            path: "title",
            tokenOrder: "sequential",
            fuzzy: {
              maxEdits: 3,
            },
          },
        },
      },
      {
        $limit: 10,
      },
      {
        $project: {
          _id: 0,
          title: 1,
        },
      },
    ]);

    if (!suggestions.length) {
      return res
        .status(200)
        .json(new ApiResponse(200, [], "No suggestions found"));
    }

    const titles = suggestions.map((v) => v.title);

    return res
      .status(200)
      .json(new ApiResponse(200, titles, "Suggestions fetched successfully"));
  }
);

export {
  getVideoSignature,
  uploadVideo,
  updateVideoDetails,
  updateThumbnail,
  getAllVideos,
  deleteVideo,
  getSuggestions,
};
