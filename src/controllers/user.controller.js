import { asyncHandler } from "../utils/asyncHandler.js"
import {apiError} from "../utils/apiError.js"
import {apiResponse} from "../utils/apiResponse.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from '../utils/cloudinary.js';

const registerUser = asyncHandler(async (req,res) => {
    const {userName,email,password} = req.body;

    if(
        [userName,email,password].some((field)=> field?.trim() === "")
    ){
        throw new apiError(400,"All fields are required.")
    }

    const emailExist = await User.findOne({
        // $or: [{email}]
        email
    })
    if (emailExist) {
        throw new apiError(400,"email already exist.")
    }

    const userNameExist = await User.findOne({
        userName
    })
    if (userNameExist) {
        throw new apiError(409,"username already exist.")
    }

    // const avatarLocalPath = await req.files?.avatar[0]?.path
    // if (!avatarLocalPath) {
    //     throw new apiError(400,"avatar is required.")
    // }
    let avatarLocalPath;
    if (req.files && Array.isArray(req.files.avatar) && req.files.avatar.length > 0) {
        avatarLocalPath = await req.files.avatar[0].path
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath);
    if (!avatar) {
        throw new apiError(400,"avatar is required.")
    }

    const user = await User.create({
        userName: userName.toLowerCase(),
        email,
        password,
        avatar: avatar.url
    })

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )
    if (!createdUser) {
        throw new apiError(500,"user not created.")
    }

    return res.status(200).json(
        new apiResponse(200,createdUser,"user registered successfully.")
    )
})

export {registerUser}