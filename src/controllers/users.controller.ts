import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadFile } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import mongoose, { Types } from "mongoose";
import type { NextFunction, Request } from "express";

import type { AuthTypedRequest, TypedRequest } from "../types/request.js";
import type { Response } from "express";
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
import { authService } from "../services/auth.service.js";
import { userService } from "../services/users.service.js";

const registerUser = asyncHandler(
  async (req: TypedRequest<RegisterUserSchema>, res: Response) => {
    const { fullName, email, username, password } = req.body;

    const createdUser = authService.registerUser({
      fullName,
      email,
      username,
      password,
    });

    return res
      .status(201)
      .json(new ApiResponse(201, createdUser, "User registered sucessfully!"));
  }
);

const loginUser = asyncHandler(
  async (req: TypedRequest<LoginUserSchema>, res: Response) => {
    const { email, password } = req.body;
    const existingUser = await authService.loginUser({ email, password });

    return res
      .status(200)
      .cookie("accessToken", existingUser.accessToken, accessTokenOptions)
      .cookie("refreshToken", existingUser.refreshToken, refreshTokenOptions)
      .json(
        new ApiResponse(200, existingUser.user, "User loggedIn successfully")
      );
  }
);

const logoutUser = asyncHandler(async (req: Request, res: Response) => {
  const incomingRefreshToken = req.cookies?.refreshToken;

  await authService.logoutUser(incomingRefreshToken);

  return res
    .status(200)
    .clearCookie("accessToken", accessTokenOptions)
    .clearCookie("refreshToken", refreshTokenOptions)
    .json(new ApiResponse<null>(200, null, "User logged out"));
});

const refreshAccessToken = asyncHandler(
  async (req: TypedRequest, res: Response, next: NextFunction) => {
    const incomingRefreshToken = req.cookies.refreshToken;

    if (!incomingRefreshToken) {
      throw new ApiError(
        401,
        "UNAUTHORIZED_REQUEST",
        "No refresh token provided"
      );
    }
    const { accessToken, newRefreshToken } =
      await authService.refreshAccessToken(incomingRefreshToken);
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
      new ApiResponse(
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

    await authService.changeCurrentPassword(req.user._id, {
      oldPassword,
      newPassword,
    });

    return res
      .status(200)
      .clearCookie("refreshToken", accessTokenOptions)
      .clearCookie("accessToken", refreshTokenOptions)
      .json(new ApiResponse<{}>(200, {}, "Login again with the new password."));
  }
);

const updateDetails = asyncHandler(
  async (req: AuthTypedRequest<UpdateUserSchema>, res: Response) => {
    const { fullName } = req.body;

    const updatedUser = await userService.updateDetails(req.user._id, fullName);

    return res
      .status(200)
      .json(
        new ApiResponse(200, updatedUser, "Account details updated sucessfully")
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

    const updatedUser = await userService.updateAvatar(
      avatarLocalFile,
      req.user._id,
      req.user.avatar.publicId
    );

    return res
      .status(200)
      .json(new ApiResponse(200, updatedUser, "Avatar updated successfully"));
  }
);

const updateCoverImage = asyncHandler(
  async (req: AuthTypedRequest, res: Response) => {
    const coverImageLocalFile = req.file?.path;

    if (!coverImageLocalFile)
      throw new ApiError(400, "Cover image is required.");

    const updatedUser = await userService.updateCoverImage(
      coverImageLocalFile,
      req.user._id,
      req.user.coverImage.publicId
    );

    return res
      .status(200)
      .json(
        new ApiResponse(200, updatedUser, "Cover Image updated successfully")
      );
  }
);

const getUserChannelProfile = asyncHandler(
  async (req: AuthTypedRequest<any, any, UserParamSchema>, res: Response) => {
    const { username } = req.params;

    const channel = await userService.getUserProfile(username, req.user._id);

    return res
      .status(200)
      .json(new ApiResponse(200, channel, "User channel fetched sucessfully!"));
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
};
