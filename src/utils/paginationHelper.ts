export function pageinationHelper(
  data: Record<string, any>[],
  limit: number,
  paginationTokenExists: boolean
) {
  if (!data || data.length === 0) {
    return {
      data: [],
      nextCursor: null,
      hasNextPage: false,
    };
  }
  const hasNextPage = data.length > limit;
  const response = data.slice(0, limit);
  return {
    data: response,
    nextCursor: hasNextPage
      ? paginationTokenExists
        ? (response[response.length - 1]?.paginationToken ?? null)
        : (response[response.length - 1]?._id ?? null)
      : null,
    hasNextPage,
  };
}
