import { Schema, model } from "mongoose";
import jwt, { type Secret, type SignOptions } from "jsonwebtoken";
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
        default: "",
      },
      publicId: {
        type: String,
        default: "",
      },
    },
    coverImage: {
      url: {
        type: String,
        default: "",
      },
      publicId: {
        type: String,
        default: "",
      },
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      select: false,
    },
    refreshToken: {
      type: String,
      select: false,
    },
    subscribers: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 10);
});

userSchema.methods.isPasswordCorrect = async function (
  this: IUserDocument,
  password: string
) {
  return bcrypt.compare(password, this.password);
};

userSchema.methods.generateAccessToken = function (this: IUserDocument) {
  return jwt.sign(
    {
      _id: this._id,
      email: this.email,
      username: this.username,
      token_type: "access",
    },
    process.env.ACCESS_TOKEN_SECRET as Secret,
    {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRY as SignOptions["expiresIn"],
    }
  );
};
userSchema.methods.generateRefreshToken = function (this: IUserDocument) {
  return jwt.sign(
    {
      _id: this._id as string,
      token_type: "refresh",
    },
    process.env.REFRESH_TOKEN_SECRET! as Secret,
    {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRY as SignOptions["expiresIn"],
    }
  );
};

export const User = model<IUserDocument>("User", userSchema);
