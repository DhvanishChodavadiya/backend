import { asyncHandler } from "../utils/asyncHandler.js";
import { apiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import { Playlist } from "../models/playlist.model.js";
import { isValidObjectId } from "mongoose";
import { Video } from "../models/video.model.js";

const createPlayList = asyncHandler(async (req, res) => {
  const { name, description } = req.body;
  if (!name || !description) {
    throw new apiError(400, "Playlist name and description are required.");
  }

  const playList = await Playlist.create({
    name,
    description,
    owner: req.user._id,
  });

  res.status(200).json(new apiResponse(200, playList, "Playlist created."));
});

const userPlaylists = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  if (!isValidObjectId(userId)) {
    throw new apiError(400, "Invalid user id.");
  }

  const userPlaylists = await Playlist.find({ owner: userId });
  if (!userPlaylists) {
    throw new apiError(404, "Playlist not found.");
  }

  const totalPlaylists = await Playlist.countDocuments({ owner: userId });

  return res
    .status(200)
    .json(
      new apiResponse(
        200,
        { userPlaylists, totalPlaylists },
        "Users all playlists fetched successfully."
      )
    );
});

const getPlaylistById = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  if (!isValidObjectId(playlistId)) {
    throw new apiError(400, "Invalid playlist id.");
  }

  const playlist = await Playlist.findById(playlistId);
  if (!playlist) {
    throw new apiError(404, "Playlist not found.");
  }

  return res
    .status(200)
    .json(new apiResponse(200, playlist, "Playlist fetched successfully."));
});

const addVideoToPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;
  if (!playlistId || !videoId) {
    throw new apiError(400, "playlist id and video id are required.");
  }

  const video = await Video.findById(videoId);
  if (!video) {
    throw new apiError(404, "Video not found.");
  }

  const playList = await Playlist.findByIdAndUpdate(
    playlistId,
    {
      $addToSet: {
        videos: video,
      },
    },
    {
      new: true,
    }
  );

  return res
    .status(200)
    .json(
      new apiResponse(200, playList, "Video added to playlist successfully.")
    );
});

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;
  if (!playlistId || !videoId) {
    throw new apiError(400, "playlist id and video id are required.");
  }

  await Playlist.findByIdAndUpdate(
    playlistId,
    {
      $pull: {
        videos: videoId,
      },
    },
    {
      new: true,
    }
  );

  return res
    .status(200)
    .json(new apiResponse(200, "Video removed from playlist successfully."));
});

const deletePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  if (!isValidObjectId(playlistId)) {
    throw new apiError(400, "Invalid playlist id.");
  }

  await Playlist.findByIdAndDelete(playlistId)

  return res.status(200)
  .json(
    new apiResponse(
        200,
        "Playlist deleted successfully."
    )
  )
});

const updatePlaylistInfo = asyncHandler(async(req,res) => {
    const {playlistId} = req.params
    const {name, description} = req.body

    if (!playlistId) {
        if (!isValidObjectId(playlistId)) {
            throw new apiError(400, "Invalid playlist id.");
        }
    }
    if (!(name || description)) {
        throw new apiError(400,"name or description is required.")
    }

    const oldPlayList = await Playlist.findById(playlistId)
    if (!oldPlayList) {
        throw new apiError(404,"Playlist not found.")
    }

    let playlist;
    if (name && !description) {
        playlist = await Playlist.findByIdAndUpdate(
            playlistId,
            {name: name},
            {new: true}
        )
    }
    if (!name && description) {
        playlist = await Playlist.findByIdAndUpdate(
            playlistId,
            {description: description},
            {new: true}
        )
    }
    if (name && description) {
        playlist = await Playlist.findByIdAndUpdate(
            playlistId,
            {name: name, description: description},
            {new: true}
        )
    }

    return res.status(200)
    .json(
        new apiResponse(
            200,
            playlist,
            "Playlist details updated successfully."
        )
    )
})

export {
  createPlayList,
  userPlaylists,
  getPlaylistById,
  addVideoToPlaylist,
  removeVideoFromPlaylist,
  deletePlaylist,
  updatePlaylistInfo
};
