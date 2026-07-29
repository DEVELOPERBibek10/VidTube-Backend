import type { ParamsDictionary } from "express-serve-static-core";
import type { Request } from "express";
import type { ParsedQs } from "qs";
import type { Types } from "mongoose";

export interface TypedRequest<
  TBody = any,
  TFiles = Express.Multer.File | Express.Multer.File[],
  TParams = ParamsDictionary,
> extends Omit<Request, "body" | "files" | "params"> {
  body: TBody;
  params: TParams;
  files?: TFiles;
}

interface UserRequest {
  _id: string | Types.ObjectId;
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
  TBody = any,
  TFile = Express.Multer.File | Express.Multer.File[],
  TParams = ParamsDictionary,
  TQuery = ParsedQs,
> extends Omit<Request, "body" | "files" | "params" | "query"> {
  body: TBody;
  user: UserRequest;
  params: TParams;
  query: TQuery;
  files?: TFile;
}
