import { asyncHandler } from "../utils/asyncHandler.js";
import { apiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import mongoose, { isValidObjectId } from "mongoose";
import { Subscription } from "../models/subscription.model.js";

const toggleSubscription = asyncHandler(async(req,res) => {
    const {channelId} = req.params;
    if (!isValidObjectId(channelId)) {
        throw new apiError(400,"Invalid channel id.")
    }

    const subscribed = await Subscription.findOne(
        {
            channel: channelId,
            subscriber: req.user._id
        }
    )

    if (subscribed) {
        await Subscription.deleteOne({_id: subscribed._id})
    }
    else {
        await Subscription.create(
            {
                channel: channelId,
                subscriber: req.user._id
            }
        )
    }

    const subscriptionStatus = await subscribed ? false : true

    return res.status(200)
    .json(
        new apiResponse(
            200,
            subscriptionStatus,
            "Subscription toggled successfully."
        )
    )
})

const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const {channelId} = req.params;
    if (!isValidObjectId(channelId)) {
        throw new apiError(400,"Invalid channel id.")
    }

    const subscriber = await Subscription.aggregate([
        {
            $match: {
                channel: new mongoose.Types.ObjectId(channelId)
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "subscriber",
                foreignField: "_id",
                as: "subscriber",
                pipeline: [
                    {
                        $project: {
                            userName: 1,
                            avatar: 1
                        }
                    }
                ]
            }
        }
    ])

    const totalSubscriber = await Subscription.countDocuments({ channel: channelId })

    return res.status(200)
    .json(
        new apiResponse(
            200,
            {subscriber,totalSubscriber},
            "Channel subscribers fetched successfully."
        )
    )
})

export { toggleSubscription,getUserChannelSubscribers }