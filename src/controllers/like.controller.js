import { asyncHandler } from "../utils/asyncHandler.js";
import { apiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.model.js";
import { Like } from "../models/like.model.js";
import { Comment } from "../models/comment.model.js";

const toggleVideoLike = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  if (!isValidObjectId(videoId)) {
    throw new apiError(400, "Invalid video id.");
  }

  const video = await Video.find({ videoId });
  if (!video) {
    throw new apiError(404, "Video not found.");
  }

  const existingLike = await Like.findOne({
    video: new mongoose.Types.ObjectId(videoId),
    likedBy: new mongoose.Types.ObjectId(req.user._id),
  });
  if (existingLike) {
    await Like.deleteOne({ video: videoId, likedBy: req.user._id });
  } else {
    await Like.create({
      video: videoId,
      likedBy: req.user._id,
    });
  }

  const likeStatus = (await existingLike) ? false : true;
  const totalLike = await Like.countDocuments({ video: videoId });

  return res
    .status(200)
    .json(
      new apiResponse(
        200,
        { totalLike, likeStatus },
        "Video like toggled successfully."
      )
    );
});

const toggleCommentLike = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  if (!isValidObjectId(commentId)) {
    throw new apiError(400, "Invalid comment id.");
  }

  const comment = await Comment.find({ commentId });
  if (!comment) {
    throw new apiError(404, "Comment not found.");
  }

  const existingLiked = await Like.findOne({
    comment: new mongoose.Types.ObjectId(commentId),
    likedBy: new mongoose.Types.ObjectId(req.user._id),
  });

  if (existingLiked) {
    await Like.deleteOne({
      comment: commentId,
      likedBy: req.user._id,
    });
  } else {
    await Like.create({
      comment: commentId,
      likedBy: req.user._id,
    });
  }

  const likeStatus = (await existingLiked) ? false : true;
  const totalLike = Like.countDocuments({ comment: commentId });

  return res
    .status(200)
    .json(
      new apiResponse(
        200,
        { totalLike, likeStatus },
        "Comment like toggled successfully."
      )
    );
});

const toggleTweetLike = asyncHandler(async(req,res) => {
  const { tweetId } = req.params;
  if (!isValidObjectId(tweetId)) {
    throw new apiError(400,"Invalid tweet id.")
  }

  const existingLiked = await Like.findOne({tweet: tweetId, likedBy: req.user._id})

  if (existingLiked) {
    await Like.deleteOne({tweet: tweetId, likedBy: req.user._id})
  }
  else {
    await Like.create(
      {
        tweet: tweetId,
        likedBy: req.user._id
      }
    )
  }

  const likeStatus = await existingLiked ? false : true;
  const totalLike = await Like.countDocuments({tweet: tweetId})

  return res
  .status(200)
  .json(
    new apiResponse(
      200,
      {likeStatus,totalLike},
      "Tweet like toggled successfully."
    )
  )
})

const getAllLikedVideos = asyncHandler(async (req, res) => {
  const likedVideos = await Like.aggregate([
    {
      $match: {
        likedBy: new mongoose.Types.ObjectId(req.user._id),
      },
    },
    {
      $match: {
        video: {
          $exists: true,
        },
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "video",
        foreignField: "_id",
        as: "video",
        pipeline: [
          {
            $project: {
              videoFile: 1,
              title: 1,
              description: 1,
              thumbnail: 1,
              duration: 1,
            },
          },
          {
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "owner",
              pipeline: [
                {
                  $project: {
                    userName: 1,
                    avatar: 1,
                  },
                },
              ],
            },
          },
          {
            $addFields: {
              owner: {
                $first: "$owner",
              },
            },
          },
        ],
      },
    },
    
  ]);

  return res.status(200)
  .json(
    new apiResponse(
        200,
        likedVideos,
        "All liked videos fetched successfully."
    )
  )
});

export { toggleVideoLike, toggleCommentLike, getAllLikedVideos, toggleTweetLike };
