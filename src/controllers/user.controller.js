import { asyncHandler } from "../utils/asyncHandler.js"
import {apiError} from "../utils/apiError.js"
import {apiResponse} from "../utils/apiResponse.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from '../utils/cloudinary.js';
import jwt from "jsonwebtoken";

const generateAccessTokenAndRefreshTokens = async(userId) =>{
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()
        user.refreshToken = refreshToken
        await user.save({validateBeforeSave: false})
        return {accessToken,refreshToken}
    } catch (error) {
        throw new apiError(500,"something went wrong.")
    }
}

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

const loginUser = asyncHandler(async(req,res) => {
    const {email,userName,password} = req.body;
    // console.log(email);
    if (!email && !userName) {
        throw new apiError(400,"username or email is required.")
    }
    const user = await User.findOne({
        $or: [{email},{userName}]
    })
    if(!user){
        throw new apiError(400,"user not exist.")
    }

    const isPasswordValid = await user.isPasswordCorrect(password)
    if (!isPasswordValid) {
        throw new apiError(400,"invalid password.")
    }
    
    const {accessToken,refreshToken} = await generateAccessTokenAndRefreshTokens(user._id)
    // console.log(accessToken);

    const loggedinUser = await User.findById(user._id).select("-password -refreshToken")

    const options = {
        httpOnly: true,
        secure: true
    }

    return res.status(200)
    .cookie("accessToken",accessToken,options)
    .cookie("refreshToken",refreshToken,options)
    .json(
        new apiResponse(
            200,
            {
                loggedinUser,accessToken,refreshToken
            },
            "User loggedin successfully."
        )
    )
       
})

const logoutUser = asyncHandler(async(req,res) => {
    await User.findByIdAndUpdate(
            req.user._id,
            {
                refreshToken: undefined
            },
            {
                new: true
            }
    )
    const options = {
        httpOnly: true,
        secure: true
    }

    return res.status(200)
    .clearCookie("accessToken",options)
    .clearCookie("refreshToken",options)
    .json(
        new apiResponse(200,{},"user logged out.")
    )
})

const refreshAccessToken = asyncHandler(async(req,res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken
    if (!incomingRefreshToken) {
        throw new apiError(401,"Unauthorized refresh token.")
    }

    try {
        const decodedToken = jwt.verify(incomingRefreshToken,process.env.REFRESH_TOKEN_SECRET)
        const user = await User.findById(decodedToken._id)
        if (incomingRefreshToken !== user?.refreshToken) {
            throw new apiError(400,"refresh token expired.")
        }
        const {accessToken,newRefreshToken} = user.generateAccessTokenAndRefreshTokens(user._id)

        const options = {
            httpOnly: true,
            secure: true
        }

        return res.status(200)
        .cookie("accessToken",accessToken,options)
        .cookie("refreshToken",newRefreshToken,options)
        .json(
            new apiResponse(
                200,
                {
                    accessToken,
                    refreshToken: newRefreshToken
                },
                "Access token refreshed."
            )
        )
    } catch (error) {
        
    }
})

export {registerUser, loginUser, logoutUser,refreshAccessToken}