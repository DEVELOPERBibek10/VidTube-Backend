export interface UserSuggestion {
  username: string;
  score: number;
}

export interface VideoTitleSuggestion {
  title: string;
  score: number;
}

export interface UserSearchResult {
  username: string;
  avatar: {
    url: string;
  };
  subscriberCount: number;
  isSubscribed: boolean;
  paginationToken?: string;
  score: number;
}

export interface VideoSearchResult {
  _id: string;
  title: string;
  description: string;
  duration: number;
  views: number;
  creator: {
    username: string;
    avatar: {
      url: string;
      publicId: string;
    };
  };
  video: {
    url: string;
    publicId: string;
  };
  thumbnail: {
    url: string;
    publicId: string;
  };
  createdAt: Date;
}
