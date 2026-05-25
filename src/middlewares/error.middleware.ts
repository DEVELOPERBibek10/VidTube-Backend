import type { NextFunction, Request, Response } from "express";
import type { GlobalError } from "../types/Error/GobalError.js";
import { Error as MongooseError } from "mongoose";
import { ApiError } from "../utils/ApiError.js";
import { MulterError } from "multer";
import type { MongoDuplicateKeyError } from "../types/Error/mongooseError.js";

const globalErrorHandler = (
  err: GlobalError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let statusCode = 500;
  let message = "Internal Server Error";
  let errors: any[] = [];
  let code = "INTERNAL_SERVER_ERROR";

  if (err instanceof ApiError) {
    statusCode = err.statusCode;
    message = err.message;
    code = err.code;
    errors = err.errors;
  } else if (err instanceof MongooseError.ValidationError) {
    const errorValues = Object.values(err.errors);
    const hasUniqueViolation = errorValues.some((el) => el.kind === "unique");
    const uniqueErrors = errorValues.filter((e) => e.kind === "unique");
    const uniqueFields = uniqueErrors.map((e) => e.path);
    statusCode = hasUniqueViolation ? 409 : 400;
    code = hasUniqueViolation ? "DUPLICATE_KEY_ERROR" : "VALIDATION_ERROR";
    message = hasUniqueViolation
      ? `Duplicate value for field(s): ${uniqueFields.join(", ")}`
      : "Validation Failed";
    errors = hasUniqueViolation
      ? uniqueErrors.map((e) => e.message)
      : errorValues.map((el) => el.message);
  } else if ("code" in err && (err as MongoDuplicateKeyError).code === 11000) {
    const duplicatedField = Object.keys(
      (err as MongoDuplicateKeyError).keyValue
    ).join(", ");
    statusCode = 409;
    code = "DUPLICATE_KEY_ERROR";
    message = `Duplicate value for field(s): ${duplicatedField}`;
  } else if (err instanceof MulterError) {
    statusCode = 400;
    code = "MULTER_ERROR";
    if (err.code === "LIMIT_FILE_SIZE") {
      message = "File is too large. Max limit is 10MB.";
    } else if (err.code === "LIMIT_UNEXPECTED_FILE") {
      message = "Unexpected file field.";
    } else {
      message = err.message || "File upload error.";
    }
  } else if (err instanceof MongooseError.CastError) {
    statusCode = 400;
    code = "CAST_ERROR";
    message = `Invalid resource identifier: ${err.path}`;
  } else if ("type" in err && err.type === "entity.parse.failed") {
    statusCode = 400;
    code = "JSON_PARSE_ERROR";
    message = "Invalid JSON body provided";
  } else if (err instanceof Error) {
    message = err.message || message;
  }

  // Send response
  return res
    .status(statusCode)
    .json(
      new ApiError(
        statusCode,
        code,
        message,
        errors,
        process.env.NODE_ENV === "development" ? err.stack : undefined
      )
    );
};

export default globalErrorHandler;
