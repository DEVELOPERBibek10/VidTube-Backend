import type { Response } from "express";
import { Types } from "mongoose";
import {
  clearHistory,
  createHistory,
  deleteHistory,
  getWatchHistory,
} from "../services/watchHistory.service.js";
import type { AuthTypedRequest } from "../types/request.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import type {
  CreateWatchHistorySchema,
  DeleteWatchHistorySchema,
  FetchWatchHistorySchema,
} from "../validators/watchHistory.validator.js";
import type { MongoId } from "../types/id.js";

const saveWatchHistory = asyncHandler(
  async (req: AuthTypedRequest<CreateWatchHistorySchema>, res: Response) => {
    const { videoId, watchTime } = req.body;

    await createHistory(req.user._id, videoId, watchTime);

    return res
      .status(200)
      .json(new ApiResponse(200, {}, "Watch history saved successfully"));
  }
);

const fetchWatchHistory = asyncHandler(
  async (
    req: AuthTypedRequest<null, null, FetchWatchHistorySchema>,
    res: Response
  ) => {
    const { historyId } = req.query;

    const history = await getWatchHistory(req.user._id, historyId as MongoId);

    return res
      .status(200)
      .json(
        new ApiResponse(200, history, "Watch history fetched successfully")
      );
  }
);

const removeHistoryItem = asyncHandler(
  async (
    req: AuthTypedRequest<null, null, DeleteWatchHistorySchema>,
    res: Response
  ) => {
    const { historyId } = req.params;

    await deleteHistory(historyId);

    return res
      .status(200)
      .json(
        new ApiResponse(200, {}, "Watch history item deleted successfully")
      );
  }
);

const removeAllHistory = asyncHandler(
  async (req: AuthTypedRequest, res: Response) => {
    await clearHistory(req.user._id);
    return res
      .status(200)
      .json(new ApiResponse(200, {}, "Watch history cleared successfully"));
  }
);

export {
  saveWatchHistory,
  fetchWatchHistory,
  removeHistoryItem,
  removeAllHistory,
};
