import type { Response, NextFunction } from "express";
import { ZodError } from "zod";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ZodType } from "zod";
import type { TypedRequest } from "../types/Request-Response/request.js";
import { ApiError } from "../utils/ApiError.js";

export const validation = (schema: ZodType) =>
  asyncHandler(async (req: TypedRequest, res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync({
        body: req.body,
        params: req.params,
        query: req.query,
      });

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
