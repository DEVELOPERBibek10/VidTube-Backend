import type { Types } from "mongoose";

export type CurrentUser = {
  id: string | Types.ObjectId;
  fullName: string;
  username: string;
  email: string;
  avatar: {
    url: string;
    publicId: string;
  };
  coverImage: {
    url: string;
    publicId: string;
  };
  createdAt: string | Date;
  updatedAt: string | Date;
};
