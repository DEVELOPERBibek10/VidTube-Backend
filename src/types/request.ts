import type { Params } from "express-serve-static-core";
import type { Request } from "express";
import type { ParsedQs } from "qs";
import type { MongoId } from "./id.js";

export interface TypedRequest<
  TBody,
  TParams extends Params | null = Params | null,
  TQuery extends ParsedQs | null = ParsedQs | null,
  TFiles = Express.Multer.File[] | Record<string, Express.Multer.File[]> | null,
> extends Omit<Request, "body" | "params" | "query" | "files" | "file"> {
  body: TBody;
  params: TParams;
  query: TQuery;
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
  TFile extends Express.Multer.File | null = Express.Multer.File | null,
  TParams extends Params | null = Params | null,
  TQuery extends ParsedQs | null = ParsedQs | null,
> extends Omit<Request, "body" | "file" | "params" | "query"> {
  body: TBody;
  user: UserRequest;
  params: TParams;
  query: TQuery;
  file: TFile;
}
