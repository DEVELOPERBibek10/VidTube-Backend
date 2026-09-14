import type { NextFunction, Request, Response } from "express";
import { ApiError } from "../utils/ApiError.js";
import { MulterError } from "multer";
import mongoose, { Error as MongooseError } from "mongoose";
import {
  handleMongoDuplicateKey,
  handleMulterError,
  handleCastError,
  handleParseError,
  handleMongooseValidationError,
} from "../utils/errorTransformers.js";
import type { GlobalError } from "../types/Error/GobalError.js";
import { HttpError } from "http-errors";

const globalErrorHandler = (
  err: GlobalError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  let error: unknown = err;

  if (err instanceof mongoose.mongo.MongoServerError && err.code === 11000)
    error = handleMongoDuplicateKey(err);
  else if (err instanceof MulterError) error = handleMulterError(err);
  else if (err instanceof MongooseError.CastError) error = handleCastError(err);
  else if (err instanceof MongooseError.ValidationError)
    error = handleMongooseValidationError(err);
  else if (
    err instanceof HttpError &&
    typeof err.status === "number" &&
    err.type === "string"
  )
    error = handleParseError(err);

  let apiError: ApiError;
  if (!(error instanceof ApiError)) {
    console.error("CRITICAL SYSTEM ERROR:", error);
    apiError = new ApiError(
      500,
      "INTERNAL_SERVER_ERROR",
      "Unexpected error occured"
    );
  } else {
    apiError = error;
  }

  res.status(apiError.statusCode).json({
    success: false,
    statusCode: apiError.statusCode,
    code: apiError.code,
    message: apiError.message,
    errors: apiError.errors?.length ? apiError.errors : undefined,
    stack: process.env.NODE_ENV === "development" ? apiError.stack : undefined,
  });
};

export default globalErrorHandler;
