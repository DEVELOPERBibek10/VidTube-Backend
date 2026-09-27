import type { NextFunction } from "express";
import { ZodError, type ZodObject, type ZodType } from "zod";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import type { Params } from "express-serve-static-core";
import type { ParsedQs } from "qs";

type RequestSchema = ZodObject<{
  body?: ZodType;
  params?: ZodType;
  query?: ZodType;
  file?: ZodType;
}>;

type ValidationRequest = {
  body: Record<string, unknown>;
  params: Params;
  query: ParsedQs;
  file: Express.Multer.File;
};

function normalizeSection(value: unknown): unknown {
  if (value === undefined || value === null) {
    return null;
  }

  if (
    typeof value === "object" &&
    !Array.isArray(value) &&
    Object.keys(value).length === 0
  ) {
    return null;
  }

  return value;
}

function formatValidationError(error: ZodError): ApiError {
  const validationIssues = error.issues.map((issue) => ({
    field: issue.path.join("."),
    message: issue.message,
  }));

  const summaryMessage = validationIssues
    .map((issue) => `${issue.field}: ${issue.message}`)
    .join(", ");

  return new ApiError(
    400,
    "VALIDATION_ERROR",
    summaryMessage || error.message,
    validationIssues
  );
}

export const validation = (schema: RequestSchema) =>
  asyncHandler(async (req: ValidationRequest, _res, next: NextFunction) => {
    try {
      const parsedRequest = await schema.parseAsync({
        body: req.body ?? {},
        params: req.params ?? {},
        query: req.query ?? {},
        file: req.file,
      });

      req.body = normalizeSection(
        parsedRequest.body
      ) as ValidationRequest["body"];
      req.params = normalizeSection(
        parsedRequest.params
      ) as ValidationRequest["params"];
      req.query = normalizeSection(
        parsedRequest.query
      ) as ValidationRequest["query"];
      req.file = normalizeSection(
        parsedRequest.file
      ) as ValidationRequest["file"];
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        throw formatValidationError(error);
      }

      throw error;
    }
  });
