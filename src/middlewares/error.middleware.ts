// src/middlewares/globalErrorHandler.ts
import type { NextFunction, Request, Response } from "express";
import { ApiError } from "../utils/ApiError.js";
import { MulterError } from "multer";
import mongoose, { Error as MongooseError } from "mongoose";
import {
  handleMongoDuplicateKey,
  handleMulterError,
  handleCastError,
  handleParseError,
} from "../utils/errorTransformers.js";
import type { GlobalError } from "../types/Error/GobalError.js";

const globalErrorHandler = (
  err: GlobalError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let error = err;

  if (err instanceof mongoose.mongo.MongoServerError && err.code === 11000)
    error = handleMongoDuplicateKey(err);
  else if (err instanceof MulterError) error = handleMulterError(err);
  else if (err instanceof MongooseError.CastError) error = handleCastError(err);
  else if (
    "body" in err &&
    typeof err.status === "number" &&
    err.type === "string" &&
    err.type.includes(".")
  )
    error = handleParseError(err);

  if (!(error instanceof ApiError)) {
    console.error("CRITICAL SYSTEM ERROR:", error);
    error = new ApiError(
      500,
      "INTERNAL_SERVER_ERROR",
      error.message || "Internal Server Error"
    );
  }

  res.status(error.statusCode).json({
    success: false,
    statusCode: error.statusCode,
    code: error.code,
    message: error.message,
    errors: error.errors?.length ? error.errors : undefined,
    stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
  });
};

export default globalErrorHandler;
