import { Types } from "mongoose";

export const validateId = (id: string) => {
  return Types.ObjectId.isValid(id);
};
