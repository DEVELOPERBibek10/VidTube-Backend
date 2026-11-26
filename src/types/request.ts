import type { Request } from "express";

export type OptionalFile = Express.Multer.File | undefined;

/**
 * Express always populates `params` and `query` with an object, even when the
 * client sends none, so unused sections are `{}` at runtime (never `undefined`).
 */
export type EmptyObject = Record<string, never>;

export interface TypedRequest<
  TBody,
  TParams = EmptyObject,
  TQuery = EmptyObject,
  TFile = OptionalFile,
> extends Omit<Request, "body" | "params" | "query" | "files" | "file"> {
  body: TBody;
  params: TParams;
  query: TQuery;
  file: TFile;
}

interface UserRequest {
  _id: string;
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
  TFile = OptionalFile,
  TParams = EmptyObject,
  TQuery = EmptyObject,
> extends Omit<Request, "body" | "file" | "params" | "query"> {
  body: TBody;
  user: UserRequest;
  params: TParams;
  query: TQuery;
  file: TFile;
}
