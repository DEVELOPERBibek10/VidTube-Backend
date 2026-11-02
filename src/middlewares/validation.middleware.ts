import type { NextFunction, Request } from "express";
import { type ZodObject } from "zod";
import { asyncHandler } from "../utils/asyncHandler.js";
import type { AuthTypedRequest, TypedRequest } from "../types/request.js";

type RequestSchema = ZodObject;
type ValidationRequest = AuthTypedRequest<unknown> | TypedRequest<unknown>;

export const validation = (schema: RequestSchema) =>
  asyncHandler(async (req: ValidationRequest, _res, next: NextFunction) => {
    const parsedRequest = await schema.parseAsync({
      body: req.body ?? {},
      params: req.params ?? {},
      query: req.query ?? {},
      file: req.file,
    });
    if ("body" in parsedRequest) {
      req.body = parsedRequest.body;
    }

    if ("params" in parsedRequest) {
      req.params = parsedRequest.params as Request["params"];
    }

    if ("query" in parsedRequest) {
      req.query = parsedRequest.query as Request["query"];
    }

    if ("file" in parsedRequest) {
      req.file = parsedRequest.file as Request["file"];
    }
    next();
  });
