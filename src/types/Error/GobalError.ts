import type { Error as MongooseError } from "mongoose";
import type { MulterError } from "multer";
import type { ApiError } from "../../utils/ApiError.js";

export type GlobalError =
  | ApiError
  | MongooseError.ValidationError
  | MongooseError.CastError
  | MulterError
  | SyntaxError
  | Error
  | any;
