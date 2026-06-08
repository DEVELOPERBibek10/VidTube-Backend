import type { NextFunction, Response } from "express";
import type { AuthTypedRequest } from "../types/Request-Response/request.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { Video } from "../models/video.model.js";
import { User } from "../models/user.model.js";

const updateWatchHistory = asyncHandler(
  async (
    req: AuthTypedRequest<null, null, { videoId: string }>,
    res: Response,
    next: NextFunction
  ) => {
    const { videoId } = req.params;
    if (!videoId) throw new ApiError(400, "Video id is required");

    const user = await User.findById(req.user._id).select("-_id watchHistory");

    const isPresent = await Video.exists({ _id: videoId });
    if (!isPresent) throw new ApiError(404, "Video not found");

    const isRepeatedRefresh =
      user!.watchHistory[0]?.toString() === isPresent._id.toString();

    if (isRepeatedRefresh) {
      return next();
    }

    const existsInHistory = user!.watchHistory.includes(videoId as never);

    if (existsInHistory) {
      await User.findByIdAndUpdate(req.user._id, {
        $pull: { watchHistory: videoId },
      });

      await User.findByIdAndUpdate(req.user._id, {
        $push: { watchHistory: { $each: [videoId], $position: 0 } },
      });
    } else {
      await User.findByIdAndUpdate(req.user._id, {
        $push: { watchHistory: { $each: [videoId], $position: 0 } },
      });
      await Video.findByIdAndUpdate(videoId, { $inc: { views: 1 } });
    }

    next();
  }
);

export { updateWatchHistory };
