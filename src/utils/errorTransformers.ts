import type { MulterError } from "multer";
import { ApiError } from "./ApiError.js";
import mongoose, { Error as MongooseError } from "mongoose";

export const handleMongoDuplicateKey = (
  err: mongoose.mongo.MongoServerError
): ApiError => {
  let duplicatedFields: string[] = [];
  if (err.keyValue && typeof err.keyValue === "object") {
    duplicatedFields = Object.keys(err.keyValue);
  } else {
    const match = (err.message || "").match(/index:\s+([\w.]+?)_/i);
    if (match && match[1]) duplicatedFields = [match[1]];
  }
  if (duplicatedFields.length === 0) {
    return new ApiError(
      409,
      "DUPLICATE_KEY_ERROR",
      "A record with these credentials already exists.",
      ["Resource conflict detected."]
    );
  }

  const parsedErrors = duplicatedFields.map((f) => `${f} must be unique`);

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

export const handleParseError = (err: any): ApiError => {
  if (err.type === "entity.parse.failed") {
    return new ApiError(400, "JSON_PARSE_ERROR", "Invalid JSON body provided");
  }
  if (err.type === "entity.too.large") {
    return new ApiError(
      400,
      "PAYLOAD_TOO_LARGE",
      "Payload too large. Max limit is 20KB."
    );
  }
  if (err.type === "encoding.unsupported") {
    throw new ApiError(400, "UNSUPPORTED_ENCODING", "Unsupported encoding");
  }
  return new ApiError(400, "PARSE_ERROR", "Failed to parse request body");
};

export const handleMongooseValidationError = (
  error: MongooseError.ValidationError
) => {
  const messages = Object.values(error.errors)
    .map((err) => err.message)
    .join(",");

  return new ApiError(
    400,
    "VALIDATION_ERROR",
    messages || "Databse validation failed"
  );
};
