import type { NextFunction, Response } from "express";
import type {
  AuthTypedRequest,
  OptionalFile,
  TypedRequest,
} from "../types/request.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import type { ZodObject } from "zod";

type ValidationRequest =
  | AuthTypedRequest<unknown, OptionalFile, unknown, unknown>
  | TypedRequest<unknown, unknown, unknown>;

export function validation<TSchema extends ZodObject>(schema: TSchema) {
  return asyncHandler(
    async (req: ValidationRequest, _res: Response, next: NextFunction) => {
      const parsedRequest = await schema.parseAsync({
        body: req.body ?? {},
        params: req.params ?? {},
        query: req.query ?? {},
        file: req.file,
      });

      if (typeof parsedRequest === "object" && parsedRequest !== null) {
        const parsed = parsedRequest as Record<string, unknown>;

        if ("body" in parsed) req.body = parsed.body;
        if ("params" in parsed) req.params = parsed.params;
        if ("query" in parsed) req.query = parsed.query;
        if ("file" in parsed) req.file = parsed.file as Express.Multer.File;
      }

      next();
    }
  );
}
