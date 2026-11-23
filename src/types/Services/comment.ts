export type CreateComment = {
  content: string;
  video: string;
  parentId?: string;
  owner: string;
};

export type UpdateComment = {
  content: string;
};

export type GetAllCommentsBase = {
  userId: string;
  videoId: string;
  cursor: string | null; // The cursor is the ID of the last comment fetched in the previous request
  parentId?: string;
};

export type GetAllComments = GetAllCommentsBase;
