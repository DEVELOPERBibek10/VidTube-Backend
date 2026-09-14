import type { NextFunction } from "express";
import { ZodError, type ZodObject } from "zod";
import { asyncHandler } from "../utils/asyncHandler.js";
import type { ZodType } from "zod";
import type { AuthTypedRequest, TypedRequest } from "../types/request.js";
import { ApiError } from "../utils/ApiError.js";
import type { Params } from "express-serve-static-core";
import type { ParsedQs } from "qs";

type RequestSchema = ZodObject<{
  body?: ZodType;
  params?: ZodType;
  query?: ZodType;
  file?: ZodType;
}>;

function normalizeSection(value: unknown): unknown {
  if (value === undefined || value === null) return null;
  if (typeof value === "object" && Object.keys(value).length === 0) return null;
  return value;
}

export const validation = (schema: RequestSchema) =>
  asyncHandler(
    async (
      req:
        | TypedRequest<Record<string, unknown>>
        | AuthTypedRequest<Record<string, unknown> | null>,
      _,
      next: NextFunction
    ) => {
      try {
        const parseData = await schema.parseAsync({
          body: req.body ?? {},
          params: req.params ?? {},
          query: req.query ?? {},
          file: req.file ?? null,
        });
        req.body = normalizeSection(parseData.body) as Record<
          string,
          unknown
        > | null;
        req.params = normalizeSection(parseData.params) as Params;
        req.query = normalizeSection(parseData.query) as ParsedQs;
        req.file = normalizeSection(
          parseData.file
        ) as Express.Multer.File | null;
        next();
      } catch (error) {
        if (error instanceof ZodError) {
          const validationIssues = error.issues.map((issue) => ({
            field: issue.path.join("."),
            message: issue.message,
          }));

          const summaryMessage = validationIssues
            .map((it) => `${it.field}: ${it.message}`)
            .join(", ");

          throw new ApiError(
            400,
            "VALIDATION_ERROR",
            summaryMessage || error.message,
            validationIssues
          );
        }
        throw error;
      }
    }
  );
