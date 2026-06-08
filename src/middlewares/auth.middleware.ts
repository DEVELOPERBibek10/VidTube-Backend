import { User } from "../models/user.model.js";
import jwt, { type JwtPayload } from "jsonwebtoken";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import type { NextFunction, Response } from "express";
import type { AuthTypedRequest } from "../types/Request-Response/request.js";

export interface DecodedToken extends JwtPayload {
  _id: string;
  email: string;
  username: string;
  fullName: string;
}

export const verifyJWT = asyncHandler(
  async (req: AuthTypedRequest, res: Response, next: NextFunction) => {
    const token =
      req.cookies?.accessToken ||
      req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      throw new ApiError(401, "UNAUTHORIZED", "Unauthorized request");
    }
    try {
      const decodedToken = jwt.verify(
        token,
        process.env.ACCESS_TOKEN_SECRET!
      ) as DecodedToken;

      const user = await User.findById(decodedToken._id).select("-password");

      if (!user) {
        throw new ApiError(404, "NOT_FOUND", "User not found!");
      }

      req.user = user;

      next();
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      if (error instanceof jwt.TokenExpiredError) {
        throw new ApiError(401, "ACCESS_TOKEN_EXPIRED", "Session expired");
      }
      if (error instanceof jwt.JsonWebTokenError) {
        throw new ApiError(401, "INVALID_ACCESS_TOKEN", "Invalid access token");
      }
      throw error;
    }
  }
);
