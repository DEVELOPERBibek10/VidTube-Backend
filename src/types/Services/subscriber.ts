export interface PaginatedSubscriptionDocument {
  channelDetail: {
    _id: string;
    username: string;
    avatar: { url: string; publicId: string };
    subscribers: number;
    isSubscribed: boolean;
  };
}
