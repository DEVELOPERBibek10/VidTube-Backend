import { Schema, model } from "mongoose";
import jwt, { type Secret } from "jsonwebtoken";
import bcrypt from "bcrypt";
import type { IUserDocument } from "../types/Model/User.js";

const userSchema = new Schema<IUserDocument>(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    avatar: {
      url: {
        type: String,
        required: true,
      },
      publicId: {
        type: String,
        required: true,
        select: false,
      },
    },
    coverImage: {
      url: {
        type: String,
      },
      publicId: {
        type: String,
        select: false,
      },
    },
    watchHistory: [{ type: Schema.Types.ObjectId, ref: "Video" }],
    password: {
      type: String,
      required: [true, "Password is required"],
    },
    refreshToken: {
      type: String,
      select: false,
    },
  },
  { timestamps: true }
);

userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 10);
});

userSchema.methods.isPasswordCorrect = async function (password: string) {
  return await bcrypt.compare(password, this.password);
};

userSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    {
      _id: this._id,
      email: this.email,
      username: this.username,
      token_type: "access",
    },
    process.env.ACCESS_TOKEN_SECRET! as Secret,
    {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRY! as any,
    }
  );
};
userSchema.methods.generateRefreshToken = function () {
  return jwt.sign(
    {
      _id: this._id,
      email: this.email,
      username: this.username,
      token_type: "refresh",
    },
    process.env.REFRESH_TOKEN_SECRET! as Secret,
    {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRY! as any,
    }
  );
};

export const User = model<IUserDocument>("User", userSchema);
