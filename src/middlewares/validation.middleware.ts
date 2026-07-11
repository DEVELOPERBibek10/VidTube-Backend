import type { Response, NextFunction } from "express";
import z, { ZodError, ZodObject } from "zod";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ZodType } from "zod";
import type { TypedRequest } from "../types/request.js";
import { ApiError } from "../utils/ApiError.js";
import type { ParsedQs } from "qs";

type RequestSchema = ZodObject<{
  body?: ZodType;
  params?: ZodType;
  query?: ZodType;
}>;

export const validation = (schema: RequestSchema) =>
  asyncHandler(async (req: TypedRequest, res: Response, next: NextFunction) => {
    try {
      const parseData = await schema.parseAsync({
        body: req.body,
        params: req.params,
        query: req.query,
      });
      req.body = parseData.body;
      (req as any).params = parseData.params;
      req.query = parseData.query as ParsedQs;
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
  });
