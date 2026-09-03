import { Types } from "mongoose";

export interface IUser {
  username: string;
  email: string;
  fullName: string;
  avatar: {
    url: string;
    publicId: string;
  };
  coverImage: {
    url: string;
    publicId: string;
  };
  watchHistory: Types.ObjectId[] | [];
  password: string;
  refreshToken: string;
  subscribers: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface IUserMethods {
  isPasswordCorrect(password: string): Promise<boolean>;
  generateAccessToken(): string;
  generateRefreshToken(): string;
}

export interface IUserDocument extends IUser, IUserMethods {}
