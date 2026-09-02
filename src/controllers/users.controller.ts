import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import type { NextFunction, Request } from "express";

import type { AuthTypedRequest, TypedRequest } from "../types/request.js";
import type { Response } from "express";
import type {
  RegisterUserSchema,
  LoginUserSchema,
  UserParamSchema,
  ChangePasswordSchema,
  UpdateUserSchema,
  GetUserSuggestionsSchema,
  UserSearchQuerySchema,
} from "../validators/user.validator.js";
import {
  accessTokenOptions,
  refreshTokenOptions,
} from "../constants/cookieOption.js";
import {
  register,
  login,
  logout,
  renewAccessToken,
  changePassword,
} from "../services/auth.service.js";
import {
  updateInfo,
  updateProfileImage,
  updateCover,
  getProfile,
} from "../services/users.service.js";
import { userSearch, userSuggestions } from "../services/search.service.js";

const registerUser = asyncHandler(
  async (req: TypedRequest<RegisterUserSchema>, res: Response) => {
    const { fullName, email, username, password } = req.body;

    const createdUser = await register({
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
    const existingUser = await login({ email, password });

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

  await logout(incomingRefreshToken);

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
      await renewAccessToken(incomingRefreshToken);
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

    await changePassword(req.user._id, {
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

    const updatedUser = await updateInfo(req.user._id, fullName);

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

    const updatedUser = await updateProfileImage(
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

    const updatedUser = await updateCover(
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

    const channel = await getProfile(username, req.user._id);

    return res
      .status(200)
      .json(new ApiResponse(200, channel, "User channel fetched sucessfully!"));
  }
);

const getUserSearchSuggestions = asyncHandler(
  async (
    req: AuthTypedRequest<null, null, GetUserSuggestionsSchema>,
    res: Response
  ) => {
    const { username } = req.params;

    const suggestions = await userSuggestions(username);

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          suggestions,
          "User suggestions fetched successfully"
        )
      );
  }
);

const searchUsers = asyncHandler(
  async (
    req: AuthTypedRequest<null, null, UserSearchQuerySchema>,
    res: Response
  ) => {
    const { username, searchToken } = req.query;
    const users = await userSearch(
      req.user._id,
      username as string | undefined,
      searchToken as string | undefined
    );

    return res
      .status(200)
      .json(
        new ApiResponse(200, users, "User search results fetched successfully")
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
  getUserSearchSuggestions,
  searchUsers,
};
