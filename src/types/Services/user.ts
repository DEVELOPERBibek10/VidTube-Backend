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

export interface UserProfile {
  _id: MongoId;
  fullName: string;
  username: string;
  subscribersCount: number;
  channelsSubscribedToCount: number;
  isSubscribed: boolean;
  avatar: { url: string; publicId: string };
  coverImage: { url: string; publicId: string };
  email: string;
}
