import type { Types } from "mongoose";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { uploadFile } from "../utils/cloudinary.js";
import mongoose from "mongoose";
import { redisClient } from "../db/redis.js";

async function updateInfo(userId: string | Types.ObjectId, fullName: string) {
  const updatedUser = await User.findByIdAndUpdate(
    userId,
    {
      $set: {
        fullName,
      },
    },
    { new: true, runValidators: true }
  ).lean();

  if (!updatedUser) {
    throw new ApiError(404, "NOT_FOUND", "User not found");
  }

  return updatedUser;
}

async function updateProfileImage(
  avatarLocalFile: string,
  userId: string | Types.ObjectId,
  publicId: string
) {
  const avatar = await uploadFile(avatarLocalFile, publicId);

  const updatedUser = await User.findByIdAndUpdate(
    userId,
    {
      $set: {
        "avatar.url": avatar.secure_url,
        "avatar.publicId": avatar.public_id,
      },
    },
    { new: true }
  ).lean();

  if (!updatedUser) {
    throw new ApiError(404, "NOT_FOUND", "User not found");
  }

  return updatedUser;
}

async function updateCover(
  coverImageLocalFile: string,
  userId: string | Types.ObjectId,
  publicId: string
) {
  const coverImage = await uploadFile(coverImageLocalFile, publicId);

  const updatedUser = await User.findByIdAndUpdate(
    userId,
    {
      $set: {
        "coverImage.url": coverImage.secure_url,
        "coverImage.publicId": coverImage.public_id,
      },
    },
    { new: true }
  ).lean();

  if (!updatedUser) {
    throw new ApiError(404, "NOT_FOUND", "User not found");
  }

  return updatedUser;
}

async function getProfile(username: string, userId: string | Types.ObjectId) {
  const cachedChannel = await redisClient.get(`user:profile:${userId}`);
  if (cachedChannel) {
    return JSON.parse(cachedChannel);
  }
  const channel = await User.aggregate([
    {
      $match: { username: username.toLowerCase() },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "channel",
        as: "subscribers",
      },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "subscriber",
        as: "subscribedTo",
      },
    },
    {
      $addFields: {
        subscribersCount: {
          $size: "$subscribers",
        },
        channelsSubscribedToCount: {
          $size: "$subscribedTo",
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
        fullName: 1,
        username: 1,
        subscribersCount: 1,
        channelsSubscribedToCount: 1,
        isSubscribed: 1,
        avatar: {
          url: 1,
          publicId: 1,
        },
        coverImage: {
          url: 1,
          publicId: 1,
        },
        email: 1,
      },
    },
  ]);

  if (channel && channel.length > 0) {
    await redisClient.set(
      `user:profile:${channel[0]._id}`,
      JSON.stringify(channel[0]),
      "PX",
      21600
    );
  }
  return channel[0] || null;
}

export { updateInfo, updateProfileImage, updateCover, getProfile };
