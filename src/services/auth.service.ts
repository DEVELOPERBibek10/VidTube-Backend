import type { Types } from "mongoose";
import { User } from "../models/user.model.js";
import type {
  ChangePassword,
  DecodedRefreshToken,
  Login,
  Register,
} from "../types/Services/auth.js";
import { ApiError } from "../utils/ApiError.js";
import jwt from "jsonwebtoken";

class AuthService {
  private async generateAccessAndRefreshToken(userId: string | Types.ObjectId) {
    try {
      const user = await User.findById(userId)!;
      const accessToken = user!.generateAccessToken();
      const refreshToken = user!.generateRefreshToken();

      user!.refreshToken = refreshToken;
      await user!.save({ validateBeforeSave: false });

      return { accessToken, refreshToken };
    } catch (error) {
      console.log("Unexpected error (generate token): ", error);
      throw new ApiError(
        500,
        "INTERNAL_SERVER_ERROR",
        "Unable to generate refresh and access token !"
      );
    }
  }

  async registerUser(user: Register) {
    const { fullName, email, username, password } = user;

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

    const createdUser = await User.create({
      fullName,
      avatar: {
        url: "",
        publicId: "",
      },
      coverImage: {
        url: "",
        publicId: "",
      },
      email: email.toLowerCase(),
      password,
      username: username.toLowerCase(),
    });

    return createdUser;
  }
  async loginUser(user: Login) {
    const existingUser = await User.findOne({ email: user.email });

    if (!existingUser) {
      throw new ApiError(404, "USER_NOT_FOUND", "User does not exist!");
    }

    const isPasswordValid = await existingUser.isPasswordCorrect(user.password);

    if (!isPasswordValid) {
      throw new ApiError(400, "INVALID_PASSWORD", "Password did not match.");
    }

    const { accessToken, refreshToken } =
      await this.generateAccessAndRefreshToken(existingUser._id);

    return { user: existingUser, accessToken, refreshToken };
  }
  async logoutUser(refreshToken: string) {
    await User.findOneAndUpdate(
      { refreshToken },
      { refreshToken: "" },
      { new: true }
    );
  }
  async refreshAccessToken(incomingRefreshToken: string) {
    let decodedToken: DecodedRefreshToken;
    try {
      decodedToken = jwt.verify(
        incomingRefreshToken,
        process.env.REFRESH_TOKEN_SECRET!
      ) as DecodedRefreshToken;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new ApiError(
          401,
          "REFRESH_TOKEN_EXPIRED",
          "Session expired, please login again"
        );
      }

      if (error instanceof jwt.JsonWebTokenError) {
        throw new ApiError(
          401,
          "INVALID_REFRESH_TOKEN",
          "Refresh token is malformed."
        );
      }
      throw error;
    }

    const user = await User.findById(decodedToken._id).select("+refreshToken");

    if (!user) {
      throw new ApiError(404, "NOT_FOUND", "User does not exist.");
    }

    if (incomingRefreshToken !== user.refreshToken) {
      throw new ApiError(
        401,
        "INVALID_REFRESH_TOKEN",
        "Logged out due to invalid credentials!"
      );
    }

    const { accessToken, refreshToken: newRefreshToken } =
      await this.generateAccessAndRefreshToken(user._id);

    return { accessToken, newRefreshToken };
  }
  async changeCurrentPassword(
    userId: string | Types.ObjectId,
    password: ChangePassword
  ) {
    const user = await User.findById(userId);

    const isPasswordCorrect = await user!.isPasswordCorrect(
      password.oldPassword
    );

    if (!isPasswordCorrect) {
      throw new ApiError(400, "INVALID_PASSWORD", "Invalid old password");
    }

    user!.password = password.newPassword;
    await user!.save({ validateBeforeSave: false });
  }
}

export const authService = new AuthService();
