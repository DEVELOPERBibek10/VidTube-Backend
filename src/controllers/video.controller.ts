import { asyncHandler } from "../utils/asyncHandler.js";
import { type Response } from "express";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import type { AuthTypedRequest } from "../types/request.js";

import mongoose from "mongoose";
import {
  getEveryVideo,
  getSignature,
  getVideo as getVideoById,
  removeVideo,
  reviseThumbnail,
  updateVideoInfo,
  upload,
} from "../services/video.service.js";
import type {
  GetSuggestionsSchema,
  VideoSearchQuerySchema as SearchQuerySchema,
  UpdateVideoParamsSchema,
  UpdateVideoSchema,
  VideoQuerySchema,
  VideoUploadSchema,
} from "../validators/video.validator.js";
import type { MongoId } from "../types/id.js";
import {
  videoSearch,
  videoTitleSuggestions,
} from "../services/search.service.js";

const getVideoSignature = asyncHandler(
  async (req: AuthTypedRequest, res: Response) => {
    const { signature, timestamp, folder } = await getSignature();

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
        "Please provide a thumbnail for the video."
      );

    const video = await upload({
      title,
      description,
      owner: req.user._id,
      isPublished,
      videoUrl,
      videoPublicId,
      duration,
      thumbnailLocalPath,
    });

    return res
      .status(201)
      .json(new ApiResponse(201, video, "Video uploaded Sucessfully."));
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

    const updatedVideoDetail = await updateVideoInfo(
      videoId,
      req.user._id,
      updateData
    );

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
        "Thumbnail is a required "
      );
    }

    const updatedVideo = await reviseThumbnail(videoId, req.user._id);

    return res
      .status(200)
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

    await removeVideo(videoId, req.user._id);

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

    const video = await getVideoById(videoId, req.user._id);

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
    const { videoId, userId } = req.query;
    const cursor = videoId;
    const response = await getEveryVideo(cursor, userId);
    res
      .status(200)
      .json(new ApiResponse(200, response, "Videos fetched successfully"));
  }
);

const getSuggestions = asyncHandler(
  async (
    req: AuthTypedRequest<null, null, null, GetSuggestionsSchema>,
    res: Response
  ) => {
    const { title } = req.query;

    if (!title) {
      return res.status(200).json([]);
    }

    const titles = await videoTitleSuggestions(title);
    return res
      .status(200)
      .json(new ApiResponse(200, titles, "Suggestions fetched successfully"));
  }
);

// Search videos by title using vector embeddings
const searchVideos = asyncHandler(
  async (
    req: AuthTypedRequest<null, null, null, SearchQuerySchema>,
    res: Response
  ) => {
    const { searchQuery, queryHash, page } = req.query;
    const response = await videoSearch(
      req.user._id,
      searchQuery,
      queryHash,
      page
    );

    return res
      .status(200)
      .json(new ApiResponse(200, response, "Videos fetched successfully"));
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
  searchVideos,
};
