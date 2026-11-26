import type {
  UserSearchResult,
  VideoSearchResult,
} from "../types/Services/search.js";

type SearchResult = {
  video: {
    res: VideoSearchResult[];
    hasNextPage: boolean;
  };
  user: {
    res: UserSearchResult[];
    hasNextPage: boolean;
    nextCursor: string | null;
  };
};

const inFlightRequests = new Map<
  string,
  Promise<SearchResult["video"] | SearchResult["user"]>
>();

export async function coalesceSearchRequest(
  key: string,
  searchFn: () => Promise<SearchResult["video"] | SearchResult["user"]>
) {
  if (inFlightRequests.has(key)) {
    return inFlightRequests.get(key);
  }
  const result = searchFn().finally(() => inFlightRequests.delete(key));
  inFlightRequests.set(key, result);
  return result;
}
