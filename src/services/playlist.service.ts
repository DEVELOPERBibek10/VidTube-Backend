import { Playlist } from "../models/playlist.model.js";
import { ApiError } from "../utils/ApiError.js";

async function createPlaylist(
  userId: string,
  name: string,
  description?: string
) {
  const playlist = await Playlist.create({
    owner: userId,
    name,
    description,
  });

  return playlist;
}

async function addVideoToPlaylist(
  userId: string,
  playlistId: string,
  videoId: string
) {
  const playlist = await Playlist.findOneAndUpdate(
    { _id: playlistId, owner: userId, isPublished: true },
    { $addToSet: { videos: videoId } },
    { new: true }
  );

  if (!playlist) {
    throw new ApiError(
      404,
      "PLAYLIST_NOT_FOUND",
      "Playlist not found or you are not the owner."
    );
  }

  return playlist;
}

async function removeVideoFromPlaylist(
  userId: string,
  playlistId: string,
  videoId: string
) {
  const playlist = await Playlist.findOneAndUpdate(
    { _id: playlistId, owner: userId, isPublished: true },
    { $pull: { videos: videoId } },
    { new: true }
  );

  if (!playlist) {
    throw new ApiError(
      404,
      "PLAYLIST_NOT_FOUND",
      "Playlist not found or you are not the owner."
    );
  }

  return playlist;
}

export { createPlaylist, addVideoToPlaylist, removeVideoFromPlaylist };
