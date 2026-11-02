import type { Params } from "express-serve-static-core";
import type { Request } from "express";
import type { ParsedQs } from "qs";
import type { MongoId } from "./id.js";

type OptionalParams = Params | undefined;
type OptionalQuery = ParsedQs | undefined;
type OptionalFile = Express.Multer.File | undefined;

export interface TypedRequest<
  TBody,
  TParams extends OptionalParams = OptionalParams,
  TQuery extends OptionalQuery = OptionalQuery,
  TFile extends OptionalFile = OptionalFile,
> extends Omit<Request, "body" | "params" | "query" | "files" | "file"> {
  body: TBody;
  params: TParams;
  query: TQuery;
  file: TFile;
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
  TFile extends OptionalFile = OptionalFile,
  TParams extends OptionalParams = OptionalParams,
  TQuery extends OptionalQuery = OptionalQuery,
> extends Omit<Request, "body" | "file" | "params" | "query"> {
  body: TBody;
  user: UserRequest;
  params: TParams;
  query: TQuery;
  file: TFile;
}
