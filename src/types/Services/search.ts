import type { IVideo } from "../Model/Video.js";

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

export interface VideoSearchResponse {
  videos: IVideo[];
  nextCursor: string;
  hasNextPage: boolean;
}
