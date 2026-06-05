// src/middlewares/globalErrorHandler.ts
import type { NextFunction, Request, Response } from "express";
import { ApiError } from "../utils/ApiError.js";
import { MulterError } from "multer";
import { Error as MongooseError } from "mongoose";
import {
  handleMongoDuplicateKey,
  handleMulterError,
  handleCastError,
  handleParseError,
} from "../utils/errorTransformers.js";

const globalErrorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let error = err;

  if (err.code === 11000) error = handleMongoDuplicateKey(err);
  else if (err instanceof MulterError) error = handleMulterError(err);
  else if (err instanceof MongooseError.CastError) error = handleCastError(err);
  else if (err.type === "entity.parse.failed") error = handleParseError();

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
    code: error.code,
    message: error.message,
    errors: error.errors?.length ? error.errors : undefined,
    stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
  });
};

export default globalErrorHandler;
