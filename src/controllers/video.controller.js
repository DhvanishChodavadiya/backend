import {asyncHandler} from "../utils/asyncHandler.js";
import {apiError} from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import {uploadOnCloudinary} from "../utils/cloudinary.js";
import { Video } from "../models/video.model.js";
import mongoose,{isValidObjectId} from "mongoose";

const publishVideo = asyncHandler(async(req,res) => {
    const {title,description} = req.body;
    if ([title,description].some((field)=>field?.trim() === '')) {
        throw new apiError(400,"All fields are required.")
    }

    let videoFileLocalPath,thumbnailLocalPath;
    if (req.files && Array.isArray(req.files.videoFile) && req.files.videoFile.length > 0) {
        videoFileLocalPath = await req.files.videoFile[0].path;
    }
    if (req.files && Array.isArray(req.files.thumbnail) && req.files.thumbnail.length > 0) {
        thumbnailLocalPath = await req.files.thumbnail[0].path;
    }

    const videoFile = await uploadOnCloudinary(videoFileLocalPath);
    if (!videoFile) {
        throw new apiError(500,"Error while uploading video file on cloudinary.")
    }

    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);
    if (!thumbnail) {
        throw new apiError(500,"Error while uploading thumbnail file on cloudinary.")
    }

    const video = await Video.create({
        videoFile: videoFile.url,
        thumbnail: thumbnail.url,
        title,
        description,
        duration: videoFile.duration,
        owner: req.user._id
    })

    return res.status(200)
    .json(
        new apiResponse(
            200,
            video,
            "Video published successfully."
        )
    )

})

const getVideoById = asyncHandler(async(req,res) => {
    const { videoId } = req.params;
    if (!isValidObjectId(videoId)) {
        throw new apiError(404,"Video not found.")
    }
   
    const video = await Video.findById(videoId).select("-createdAt -updatedAt")
    if (!video) {
        throw new apiError(400,"Video id is invalid.")
    }

    return res.status(200)
    .json(
        new apiResponse(
            200,
            video,
            "Video fetched successfully."
        )
    )
})

const updateVideoDetails = asyncHandler(async(req,res) => {
    const { videoId } = req.params;
    if (!isValidObjectId(videoId)) {
        throw new apiError(400,"Video id is not valid.")
    }

    const {title,description} = req.body;
    const thumbnailLocalPath = req.file?.path
    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath); 
    // console.log(title,description,thumbnail);
    if ((title === "") && (description === "") && (thumbnail === "")) {
        throw new apiError(400,"Atleast one field is required.")
    }
    // if (!title && !description && !thumbnail.url) {
    //     throw new apiError(400,"one field is required.")
    // }
    if (title || description) {
        await Video.findByIdAndUpdate(
            videoId,
            {
                $set: {
                    title,
                    description
                }
            },
            {
                new: true
            }
        )
    }
    if (thumbnail) {
        await Video.findByIdAndUpdate(
            videoId,
            {
                $set: {
                    thumbnail: thumbnail.url
                }
            },
            {
                new: true
            }
        )
    }
    const video = await Video.findById(videoId)
    if (!video) {
        throw new apiError(404,"Video not found.")
    }

    return res.status(200)
    .json(
        new apiResponse(
            200,
            video,
            "Video details updated successfully."
        )
    )
})

export {
    publishVideo,
    getVideoById,
    updateVideoDetails
}