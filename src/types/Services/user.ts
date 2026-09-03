import type { MongoId } from "../id.js";

export type CurrentUser = {
  id: MongoId;
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
