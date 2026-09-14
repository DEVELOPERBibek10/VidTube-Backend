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
  files?: ZodType;
}>;

const requestSections = ["body", "params", "query", "file", "files"] as const;
type RequestSection = (typeof requestSections)[number];

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
        | AuthTypedRequest<Record<string, unknown>>,
      _,
      next: NextFunction
    ) => {
      try {
        const request = {
          body: normalizeSection(req.body),
          params: normalizeSection(req.params),
          query: normalizeSection(req.query),
          file: normalizeSection(req.file),
          files: normalizeSection(req.files),
        } satisfies Record<RequestSection, unknown>;
        const schemaShape = schema.shape as Partial<
          Record<RequestSection, ZodType>
        >;
        const unexpectedSections = requestSections
          .filter(
            (section) => !schemaShape[section] && request[section] !== null
          )
          .map((section) => ({
            field: section,
            message: `${section} is not accepted by this route.`,
          }));

        if (unexpectedSections.length > 0) {
          throw new ApiError(
            400,
            "VALIDATION_ERROR",
            unexpectedSections.map((issue) => issue.message).join(", "),
            unexpectedSections
          );
        }

        const parseData = await schema.parseAsync({
          body: schemaShape.body ? (request.body ?? {}) : undefined,
          params: schemaShape.params ? (request.params ?? {}) : undefined,
          query: schemaShape.query ? (request.query ?? {}) : undefined,
          file: schemaShape.file ? request.file : undefined,
          files: schemaShape.files ? (request.files ?? {}) : undefined,
        });
        req.body = (parseData.body ?? null) as Record<string, unknown>;
        req.params = (parseData.params ?? null) as Params;
        req.query = (parseData.query ?? null) as ParsedQs;
        req.file = (parseData.file ?? null) as Express.Multer.File | null;
        req.files = (parseData.files ?? null) as
          Express.Multer.File[] | Record<string, Express.Multer.File[]> | null;
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
