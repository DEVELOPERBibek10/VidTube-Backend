import type { Params } from "express-serve-static-core";
import type { Request } from "express";
import type { ParsedQs } from "qs";
import type { MongoId } from "./id.js";

export interface TypedRequest<
  TBody,
  TParams extends Params = Params,
  TFiles = Express.Multer.File[] | Record<string, Express.Multer.File[]> | null,
> extends Omit<Request, "body" | "params" | "files" | "file"> {
  body: TBody;
  params: TParams;
  files: TFiles;
  file: Express.Multer.File | null;
}

interface UserRequest {
  _id: MongoId;
  username: string;
  email: string;
  fullName: string;
  avatar: {
    url: string;
    publicId: string;
  };
  coverImage: {
    url: string;
    publicId: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthTypedRequest<
  TBody,
  TFile extends Express.Multer.File | Express.Multer.File[] | null =
    Express.Multer.File | Express.Multer.File[],
  TParams extends Params | null = Params,
  TQuery extends ParsedQs | null = ParsedQs,
> extends Omit<Request, "body" | "files" | "file" | "params" | "query"> {
  body: TBody;
  user: UserRequest;
  params: TParams;
  query: TQuery;
  files: TFile;
  file: Express.Multer.File | null;
}
