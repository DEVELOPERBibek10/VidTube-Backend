import type { MulterError } from "multer";
import { ApiError } from "./ApiError.js";
import { Error as MongooseError } from "mongoose";

export const handleMongDuplicateKey = (err: any): ApiError => {
  let duplicatedFields: [] | string[] = [];
  if (err.keyValue && typeof err.keyValue === "object") {
    duplicatedFields = Object.keys(err.keyValue);
  } else {
    const match = (err.message || "").match(/index:\s+([\w.]+?)_/i);
    if (match && match[1]) duplicatedFields = [match[1]];
  }
  const parsedErrors = duplicatedFields.length
    ? duplicatedFields.map((f) => `${f} must be unique`)
    : ["Duplicate key error"];
  return new ApiError(
    409,
    "DUPLICATE_KEY_ERROR",
    `Duplicate value for field(s): ${duplicatedFields.join(", ")}`,
    parsedErrors
  );
};

export const handleMulterError = (err: MulterError): ApiError => {
  let message = err.message || "File upload error";
  if (err.code === "LIMIT_FILE_SIZE")
    message = "File is too large. Max limit is 10MB.";
  if (err.code === "LIMIT_UNEXPECTED_FILE") message = "Unexpected file field.";

  return new ApiError(400, "MULTER_ERROR", message);
};

export const handleCastError = (err: MongooseError.CastError): ApiError => {
  return new ApiError(
    400,
    "CAST_ERROR",
    `Invalid resource identifier: ${err.path}`
  );
};

export const handleParseError = (): ApiError => {
  return new ApiError(400, "JSON_PARSE_ERROR", "Invalid JSON body provided");
};
