import { apiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Comment } from "../models/comment.model.js";
import { apiResponse } from "../utils/apiResponse.js";
import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.model.js";

const addComment = asyncHandler(async(req,res) => {
    const {content} = req.body;
    if (!content) {
        throw new apiError(400,"Comment content is required.")
    }

    const {videoId} = req.params;
    if(!isValidObjectId(videoId)) {
        throw new apiError(400,"Invalid video id.")
    }

    const comment = await Comment.create({
        content: content,
        video: videoId,
        owner: req.user._id
    })

    return res.status(200).
    json(
        new apiResponse(
            200,
            comment,
            "Comment added successfully."
        )
    )

})

const updateComment = asyncHandler(async(req,res) => {
    const {commentId} = req.params;
    if (!isValidObjectId(commentId)) {
        throw new apiError(400,"Invalid comment id.")
    }

    const { content } = req.body;
    if (!content) {
        throw new apiError(400,"Comment content is required.")
    }

    const comment = await Comment.findByIdAndUpdate(
        commentId,
        {
            content: content
        },
        {
            new: true
        }
    )

    return res.status(200)
    .json(
        new apiResponse(
            200,
            comment,
            "Comment updated successfully."
        )
    )
})

const deleteComment = asyncHandler(async(req,res) => {
    const {commentId} = req.params;
    if (!commentId) {
        throw new apiError(400,"Invalid comment id.")
    }

    await Comment.findByIdAndDelete(commentId)

    return res.status(200)
    .json(
        new apiResponse(
            200,
            "Comment deleted successfully."
        )
    )
})

const getAllCommentsForVideo = asyncHandler(async(req,res) => {
    // const {videoId} = req.params;
    // if (!isValidObjectId(videoId)) {
    //     throw new apiError(400,"Invalid video id.")
    // }

    // const {page,limit} = req.query;
    // const pageNo = parseInt(page);
    // const limitNo = parseInt(limit);

    // await Video.aggregate([
    //     {
    //         $match: {
    //             video: new mongoose.Types.ObjectId(videoId)
    //         }
    //     },
    //     {
    //         $lookup: {
    //             from: "videos",
    //             localField: ""
    //         }
    //     }
    // ])
    const { videoId } = req.params
    const { page = 1, limit = 10 } = req.query

    if (!isValidObjectId(videoId)) {
        throw new apiError(400, "video Id is not available")
    }

    // const video = await Video.findById(videoId)
    // if (!video) {
    //     throw new apiError(404, "Video not found with this video Id or Invalid video Id")
    // }

    const pageLimit = parseInt(limit)
    const pageNumber = parseInt(page)
    const offset = (pageNumber - 1) * pageLimit
    const skip = offset

    const comments = await Comment.aggregate([
        {
            $match: {
                video: new mongoose.Types.ObjectId(videoId)  //i'll give all comments with this videoId
            }
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
                            avatar: 1
                        }
                    }
                ]
            }
        },
        {
            $addFields: {
                owner: {
                    $first: "$owner" //return directly object not in array
                }
            }
        },
        {
            $skip: skip
        },
        {
            $limit: pageLimit
        }

    ])

    const totalComments = await Comment.countDocuments({ video: videoId })
    const totalPages = Math.ceil(totalComments / pageLimit)

    return res
        .status(200)
        .json(
            new apiResponse(200, { comments, totalComments, totalPages }, "video all Comments fetched Succesfully !")
        )

})

export {
    addComment,
    updateComment,
    deleteComment,
    getAllCommentsForVideo
}
