import type { NextFunction } from "express";
import { type ZodObject, type ZodType } from "zod";
import { asyncHandler } from "../utils/asyncHandler.js";
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
  file?: Express.Multer.File;
};

export const validation = (schema: RequestSchema) =>
  asyncHandler(async (req: ValidationRequest, _res, next: NextFunction) => {
    const parsedRequest = await schema.parseAsync({
      body: req.body ?? {},
      params: req.params ?? {},
      query: req.query ?? {},
      file: req.file,
    });
    req.body = parsedRequest.body as ValidationRequest["body"];
    req.params = parsedRequest.params as ValidationRequest["params"];
    req.query = parsedRequest.query as ValidationRequest["query"];
    if (parsedRequest.file) {
      req.file = parsedRequest.file as ValidationRequest["file"];
    }
    next();
  });
