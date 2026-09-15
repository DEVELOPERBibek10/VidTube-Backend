import type { MongoId } from "../id.js";

export interface PaginatedSubscriptionDocument {
  channelDetail: {
    _id: MongoId;
    username: string;
    avatar: { url: string; publicId: string };
    subscribers: number;
    isSubscribed: boolean;
  };
}
