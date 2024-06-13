import {asyncHandler} from "../utils/asyncHandler.js";
import {apiError} from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import {uploadOnCloudinary} from "../utils/cloudinary.js";
import { Video } from "../models/video.model.js";

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

export {publishVideo}