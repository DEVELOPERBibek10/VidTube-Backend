import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { deleteFile, uploadFile } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import mongoose, { Types } from "mongoose";
import type { Request } from "express";

import type {
  UserResponse,
  ChannelProfileResponse,
} from "../types/Request-Response/response.js";
import type {
  AuthTypedRequest,
  TypedRequest,
} from "../types/Request-Response/request.js";
import type { Response } from "express";
import type { DecodedToken } from "../middlewares/auth.middleware.js";
import type {
  RegisterUserSchema,
  LoginUserSchema,
  UserParamSchema,
  ChangePasswordSchema,
  UpdateUserSchema,
} from "../validators/user.validator.js";
import {
  accessTokenOptions,
  refreshTokenOptions,
} from "../constants/cookieOption.js";

const generateAccessAndRefreshToken = async (
  userId: string | Types.ObjectId
) => {
  try {
    const user = await User.findById(userId);
    if (!user) throw new Error("Unable to find the user");
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    if (error instanceof Error) {
      throw new ApiError(404, "USER_NOT_FOUND", error.message);
    }
    throw new ApiError(
      500,
      "INTERNAL_SERVER_ERROR",
      "Unable to generate refresh and access token !"
    );
  }
};

const registerUser = asyncHandler(
  async (req: TypedRequest<RegisterUserSchema>, res: Response) => {
    // Get the user details from frontend.
    // Validation - empty, email format.
    // check if user already exists.
    // check for images or avatar.
    // upload them to cloudinary.
    // create user object - create a user in the db
    // remove password and refresh token field from response.
    // return response.

    let avatar = null;

    const { fullName, email, username, password } = req.body;

    const existingUser = await User.findOne({
      $or: [{ username: username }, { email: email }],
    });

    if (existingUser) {
      throw new ApiError(
        409,
        "ALREADY_EXISTS",
        "A user with this email or username already exists."
      );
    }

    const avatarLocalPath = req.files?.avatar?.[0]?.path;

    if (!avatarLocalPath) {
      throw new ApiError(
        400,
        "MISSING_REQUIRED_FIELD",
        "Avatar field is required"
      );
    }

    avatar = await uploadFile(avatarLocalPath);

    if (avatar instanceof ApiError) {
      throw new ApiError(avatar.statusCode, avatar.code, avatar.message);
    }

    try {
      const user = await User.create({
        fullName,
        avatar: {
          url: avatar.secure_url,
          publicId: avatar.public_id,
        },
        coverImage: {
          url: "",
          publicId: "",
        },
        email: email.toLowerCase(),
        password,
        username: username.toLowerCase(),
      });

      const createdUser = await User.findById(user._id).select(
        "-password -watchHistory"
      );

      if (!createdUser)
        throw new ApiError(
          500,
          "INTERNAL_SERVER_ERROR",
          "Failed to register user"
        );

      return res
        .status(201)
        .json(
          new ApiResponse<UserResponse>(
            201,
            createdUser,
            "User registered sucessfully!"
          )
        );
    } catch (error: any) {
      const avatarDeletion = await deleteFile(avatar.public_id);
      if (!avatarDeletion)
        throw new ApiError(
          502,
          "STORAGE_SERVICE_UNAVAILABLE",
          "Avatar deletion failed. The asset might be orphan"
        );

      console.error("Database Registration Error:", error);
      if (error instanceof ApiError) throw error;
      throw new ApiError(
        500,
        "INTERNAL_SERVER_ERROR",
        error?.message || "Database registration failed. Assets cleared.",
        error?.errors || []
      );
    }
  }
);

const loginUser = asyncHandler(
  async (req: TypedRequest<LoginUserSchema>, res: Response) => {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      throw new ApiError(404, "USER_NOT_FOUND", "User does not exist!");
    }

    const isPasswordValid = await user.isPasswordCorrect(password);

    if (!isPasswordValid) {
      throw new ApiError(400, "INVALID_PASSWORD", "Password did not match.");
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
      user._id
    );

    const loggedInUser = await User.findById(user._id).select(
      "-password -watchHistory"
    );

    return res
      .status(200)
      .cookie("accessToken", accessToken, accessTokenOptions)
      .cookie("refreshToken", refreshToken, refreshTokenOptions)
      .json(new ApiResponse(200, loggedInUser, "User loggedIn successfully"));
  }
);

const logoutUser = asyncHandler(async (req: Request, res: Response) => {
  const incomingRefreshToken = req.cookies?.refreshToken;

  if (!incomingRefreshToken) {
    return res
      .status(200)
      .clearCookie("accessToken", accessTokenOptions)
      .clearCookie("refreshToken", refreshTokenOptions)
      .json(new ApiResponse<null>(200, null, "User logged out"));
  }

  await User.findOneAndUpdate(
    { refreshToken: incomingRefreshToken },
    { $unset: { refreshToken: 1 } },
    { new: true }
  );

  return res
    .status(200)
    .clearCookie("accessToken", accessTokenOptions)
    .clearCookie("refreshToken", refreshTokenOptions)
    .json(new ApiResponse<null>(200, null, "User logged out"));
});

const refreshAccessToken = asyncHandler(
  async (req: TypedRequest, res: Response) => {
    const incomingRefreshToken = req.cookies.refreshToken;

    if (!incomingRefreshToken) {
      throw new ApiError(
        401,
        "UNAUTHORIZED_REQUEST",
        "No refresh token provided"
      );
    }
    let decodedToken: DecodedToken;
    try {
      decodedToken = jwt.verify(
        incomingRefreshToken,
        process.env.REFRESH_TOKEN_SECRET!
      ) as DecodedToken;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        res
          .clearCookie("accessToken", accessTokenOptions)
          .clearCookie("refreshToken", refreshTokenOptions);
        throw new ApiError(
          401,
          "REFRESH_TOKEN_EXPIRED",
          "Session expired, please login again"
        );
      }
      if (error instanceof jwt.JsonWebTokenError) {
        console.log("Cookie cleared: Malformed refresh token");
        res
          .clearCookie("accessToken", accessTokenOptions)
          .clearCookie("refreshToken", refreshTokenOptions);
        throw new ApiError(401, "INVALID_TOKEN", "Refresh token is malformed.");
      }
      throw error;
    }

    const user = await User.findById(decodedToken._id).select("+refreshToken");

    if (!user || incomingRefreshToken !== user.refreshToken) {
      res
        .clearCookie("accessToken", accessTokenOptions)
        .clearCookie("refreshToken", refreshTokenOptions);
      throw new ApiError(
        401,
        "INVALID_TOKEN",
        "Logged out due to invalid credentials!"
      );
    }
    const { accessToken, refreshToken: newRefreshToken } =
      await generateAccessAndRefreshToken(user._id);
    return res
      .status(200)
      .cookie("accessToken", accessToken, accessTokenOptions)
      .cookie("refreshToken", newRefreshToken, refreshTokenOptions)
      .json(new ApiResponse<null>(200, null, "Access token refreshed"));
  }
);

const getCurrentUser = asyncHandler(
  async (req: AuthTypedRequest, res: Response) => {
    const {
      _id,
      fullName,
      username,
      email,
      avatar,
      coverImage,
      createdAt,
      updatedAt,
    } = req.user;

    return res.status(200).json(
      new ApiResponse<UserResponse>(
        200,
        {
          _id,
          fullName,
          username,
          email,
          avatar,
          coverImage,
          createdAt,
          updatedAt,
        },
        "Current user fetched successfully"
      )
    );
  }
);

const changeCurrentPassword = asyncHandler(
  async (req: AuthTypedRequest<ChangePasswordSchema>, res: Response) => {
    const { oldPassword, newPassword } = req.body;

    const user = await User.findById(req.user._id);

    if (!user) throw new ApiError(404, "NOT_FOUND", "User doesn't exist.");

    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

    if (!isPasswordCorrect) {
      throw new ApiError(400, "INVALID_OLD_PASSWORD", "Invalid old password");
    }

    user.password = newPassword;
    await user.save({ validateBeforeSave: false });

    return res
      .status(200)
      .clearCookie("refreshToken", accessTokenOptions)
      .clearCookie("accessToken", refreshTokenOptions)
      .json(new ApiResponse<{}>(200, {}, "Login again with the new password."));
  }
);

const updateDetails = asyncHandler(
  async (req: AuthTypedRequest<UpdateUserSchema>, res: Response) => {
    const { username } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        $set: {
          username,
        },
      },
      { new: true }
    ).select("-password -watchHistory");

    if (!user || !user._id) {
      throw new ApiError(404, "NOT_FOUND", "User not found");
    }

    return res
      .status(200)
      .json(
        new ApiResponse<UserResponse>(
          200,
          user,
          "Account details updated sucessfully"
        )
      );
  }
);

const updateAvatar = asyncHandler(
  async (req: AuthTypedRequest, res: Response) => {
    const avatarLocalFile = req.file?.path;

    if (!avatarLocalFile) {
      throw new ApiError(
        400,
        "MISSING_REQUIRED_FIELD",
        "Avatar image is required."
      );
    }

    const user = await User.findById(req.user._id).select(
      "+avatar.publicId -password -watchHistory"
    );

    if (!user) throw new ApiError(404, "NOT_FOUND", "User not found");

    const avatar = await uploadFile(avatarLocalFile, user.avatar.publicId);

    if (avatar instanceof ApiError) {
      throw new ApiError(avatar.statusCode, avatar.code, avatar.message);
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      {
        $set: {
          "avatar.url": avatar.secure_url,
          "avatar.publicId": avatar.public_id,
        },
      },
      { new: true }
    ).select("-password -watchHistory");

    if (!updatedUser) {
      throw new ApiError(404, "NOT_FOUND", "User not found");
    }

    return res
      .status(200)
      .json(
        new ApiResponse<UserResponse>(
          200,
          updatedUser,
          "Avatar updated successfully"
        )
      );
  }
);

const updateCoverImage = asyncHandler(
  async (req: AuthTypedRequest, res: Response) => {
    const coverImageLocalFile = req.file?.path;

    if (!coverImageLocalFile)
      throw new ApiError(400, "Cover image is required.");

    const user = await User.findById(req.user?._id).select(
      "+coverImage.publicId -password"
    );

    if (!user) throw new ApiError(404, "NOT_FOUND", "User not found");

    const coverImage = await uploadFile(
      coverImageLocalFile,
      user.coverImage!.publicId
    );

    if (coverImage instanceof ApiError) {
      throw new ApiError(
        coverImage.statusCode,
        coverImage.code,
        coverImage.message
      );
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user?._id,
      {
        $set: {
          "coverImage.url": coverImage.secure_url,
          "coverImage.publicId": coverImage.public_id,
        },
      },
      { new: true }
    ).select("-password -watchHistory");

    if (!updatedUser) throw new ApiError(404, "NOT_FOUND", "User not found");

    return res
      .status(200)
      .json(
        new ApiResponse<UserResponse>(
          200,
          updatedUser,
          "Cover Image updated successfully"
        )
      );
  }
);

const getUserChannelProfile = asyncHandler(
  async (req: AuthTypedRequest<any, any, UserParamSchema>, res: Response) => {
    const { username } = req.params;

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
                  req.user?._id
                    ? new mongoose.Types.ObjectId(req.user._id)
                    : null,
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
          },
          coverImage: {
            url: 1,
          },
          email: 1,
        },
      },
    ]);

    if (!channel?.length) {
      throw new ApiError(404, "NOT_FOUND", "Channel does not exist!");
    }

    return res
      .status(200)
      .json(
        new ApiResponse<ChannelProfileResponse>(
          200,
          channel[0],
          "User channel fetched sucessfully!"
        )
      );
  }
);

const getWatchHistory = asyncHandler(
  async (req: AuthTypedRequest, res: Response) => {
    const user = await User.aggregate([
      {
        $match: { _id: new mongoose.Types.ObjectId(req.user._id) },
      },
      {
        $lookup: {
          from: "videos",
          localField: "watchHistory",
          foreignField: "_id",
          as: "watchHistory",
          pipeline: [
            {
              $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner",
                pipeline: [
                  {
                    $project: {
                      username: 1,
                      avatar: {
                        url: 1,
                      },
                    },
                  },
                ],
              },
            },
            {
              $addFields: {
                owner: {
                  $first: "$owner",
                },
              },
            },
          ],
        },
      },
    ]);

    if (!user[0]?.length || !user[0]?.watchHistory) {
      throw new ApiError(
        404,
        "NOT_FOUND",
        "Watch history could not be found for this user."
      );
    }

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          user[0].watchHistory,
          "Watch history fetched sucessfully"
        )
      );
  }
);

export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  getCurrentUser,
  changeCurrentPassword,
  updateDetails,
  updateAvatar,
  updateCoverImage,
  getUserChannelProfile,
  getWatchHistory,
};
