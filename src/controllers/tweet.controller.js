import { asyncHandler } from "../utils/asyncHandler.js";
import { apiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import { Tweet } from "../models/tweet.model.js";
import { isValidObjectId } from "mongoose";

const createTweet = asyncHandler(async(req,res) => {
    const {content} = req.body;
    if (!content) {
        throw new apiError(400,"Content is required.")
    }

    const tweet = await Tweet.create(
        {
            content,
            owner: req.user._id
        }
    )

    res.status(200)
    .json(
        new apiResponse(
            200,
            tweet,
            "Tweet create successfully."
        )
    )
})

const getUsersTweet = asyncHandler(async(req,res) => {
    const usersTweet = await Tweet.find({owner: req.user._id})
    if (!usersTweet) {
        throw new apiError(404,"User's tweet not found.")
    }

    const usersTotalTweets = await Tweet.countDocuments({owner: req.user._id})

    return res.status(200)
    .json(
        new apiResponse(
            200,
            {usersTweet,usersTotalTweets},
            "User's all tweets fetched successfully."
        )
    )
})

const updateTweet = asyncHandler(async(req,res) => {
    const {tweetId} = req.params;
    const {content} = req.body;
    if (!isValidObjectId(tweetId)) {
        throw new apiError(400,"Invalid tweet id.")
    }
    if (!content) {
        throw new apiError(400,"Content is required.")
    }

    const tweet = await Tweet.findByIdAndUpdate(
        tweetId,
        {
            content,
        },
        {
            new: true
        }
    )

    return res.status(200)
    .json(new apiResponse(
        200,
        tweet,
        "Tweet updated successfully."
    ))
})

const deleteTweet = asyncHandler(async(req,res) => {
    const {tweetId} = req.params;
    if (!isValidObjectId(tweetId)) {
        throw new apiError(400,"Invalid tweet id.")
    }

    await Tweet.findByIdAndDelete(tweetId)

    return res.status(200)
    .json(
        new apiResponse(
            200,
            "Tweet deleted successfully."
        )
    )
})

export { createTweet,getUsersTweet,updateTweet,deleteTweet }