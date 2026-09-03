import type { ParamsDictionary } from "express-serve-static-core";
import type { Request } from "express";
import type { ParsedQs } from "qs";
import type { MongoId } from "./id.js";

export interface TypedRequest<
  TBody = Record<string, any>,
  TParams extends ParamsDictionary = ParamsDictionary,
> extends Omit<Request, "body" | "params"> {
  body: TBody;
  params: TParams;
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
  TBody = Record<string, any>,
  TFile extends Express.Multer.File | Express.Multer.File[] | null =
    Express.Multer.File | Express.Multer.File[],
  TParams extends ParamsDictionary | null = ParamsDictionary | null,
  TQuery extends ParsedQs = ParsedQs,
> extends Omit<Request, "body" | "files" | "params" | "query"> {
  body: TBody;
  user: UserRequest;
  params: TParams;
  query: TQuery;
  files: TFile;
}
