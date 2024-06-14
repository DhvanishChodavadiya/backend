import { asyncHandler } from "../utils/asyncHandler.js";
import { apiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import bcrypt  from "bcrypt";

const generateAccessTokenAndRefreshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });
    return { accessToken, refreshToken };
  } catch (error) {
    throw new apiError(500, "something went wrong.");
  }
};

const registerUser = asyncHandler(async (req, res) => {
  const { userName, email, password } = req.body;

  if ([userName, email, password].some((field) => field?.trim() === "")) {
    throw new apiError(400, "All fields are required.");
  }

  const emailExist = await User.findOne({
    // $or: [{email}]
    email,
  });
  if (emailExist) {
    throw new apiError(400, "email already exist.");
  }

  const userNameExist = await User.findOne({
    userName,
  });
  if (userNameExist) {
    throw new apiError(409, "username already exist.");
  }

  // const avatarLocalPath = await req.files?.avatar[0]?.path
  // if (!avatarLocalPath) {
  //     throw new apiError(400,"avatar is required.")
  // }
  let avatarLocalPath;
  if (
    req.files &&
    Array.isArray(req.files.avatar) &&
    req.files.avatar.length > 0
  ) {
    avatarLocalPath = await req.files.avatar[0].path;
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath);
  if (!avatar) {
    throw new apiError(400, "avatar is required.");
  }

  const user = await User.create({
    userName: userName.toLowerCase(),
    email,
    password,
    avatar: avatar.url,
  });

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );
  if (!createdUser) {
    throw new apiError(500, "user not created.");
  }

  return res
    .status(200)
    .json(new apiResponse(200, createdUser, "user registered successfully."));
});

const loginUser = asyncHandler(async (req, res) => {
  const { email, userName, password } = req.body;
  // console.log(email);
  if (!email && !userName) {
    throw new apiError(400, "username or email is required.");
  }
  const user = await User.findOne({
    $or: [{ email }, { userName }],
  });
  if (!user) {
    throw new apiError(400, "user not exist.");
  }

  const isPasswordValid = await user.isPasswordCorrect(password);
  if (!isPasswordValid) {
    throw new apiError(400, "invalid password.");
  }

  const { accessToken, refreshToken } =
    await generateAccessTokenAndRefreshTokens(user._id);
  // console.log(accessToken);

  const loggedinUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new apiResponse(
        200,
        {
          loggedinUser,
          accessToken,
          refreshToken,
        },
        "User loggedin successfully."
      )
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      refreshToken: 1,
    },
    {
      new: true,
    }
  );
  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new apiResponse(200, {}, "user logged out."));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;
  if (!incomingRefreshToken) {
    throw new apiError(401, "Unauthorized refresh token.");
  }

  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );
    const user = await User.findById(decodedToken._id);
    if (incomingRefreshToken !== user?.refreshToken) {
      throw new apiError(400, "refresh token expired.");
    }
    const { accessToken, newRefreshToken } =
      user.generateAccessTokenAndRefreshTokens(user._id);

    const options = {
      httpOnly: true,
      secure: true,
    };

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newRefreshToken, options)
      .json(
        new apiResponse(
          200,
          {
            accessToken,
            refreshToken: newRefreshToken,
          },
          "Access token refreshed."
        )
      );
  } catch (error) {}
});

const passwordChange = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  if (!oldPassword || !newPassword) {
    throw new apiError(400, "all fields are required.");
  }

  const user = await User.findById(req.user._id);
  if (!user) {
    throw new apiError(400, "User not found.");
  }

  const isPasswordValid = user.isPasswordCorrect(oldPassword);
  if (!isPasswordValid) {
    throw new apiError(400, "Old password is wrong.");
  }

  await User.findByIdAndUpdate(
    user,
    {
      $set: {
        password: await bcrypt.hash(newPassword,10)
      }
    },
    {
      new: true
    }
  )

  return res
    .status(200)
    .json(new apiResponse(200, "password changed successfully."));
});

const getCurrentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new apiResponse(200, req.user, "Current user get successfully."));
});

const updateUserDetails = asyncHandler(async(req,res) => {
    const {email,userName} = req.body;
    if (!email || !userName) {
        throw new apiError(400,"all fields are required.")
    }

    const user = await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                userName,
                email
            }
        }
    ).select("-password")
    return res.status(200).
    json(
        new apiResponse(
            200,
            user,
            "User details are updated successfully."
        )
    )
})

const updateAvatar = asyncHandler(async(req,res) => {
    const avatarLocalPath = req.file?.path
    if (!avatarLocalPath) {
        throw new apiError(400,"Avatar file is missing.")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    if (!avatar.url) {
        throw new apiError(400,"Error while uploading avatar file.")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                avatar: avatar.url
            }
        },
        {
            new: true
        }
    ).select("-password")

    return res.status(200)
    .json(
        new apiResponse(
            200,
            user,
            "Avatar updated successfully."
        )
    )
})

const getUserChannelProfile = asyncHandler(async(req,res) => {
  const {userName} = req.params;
  if (!userName?.trim()) {
    throw new apiError(400,"username is missing.")
  }

  const channel = await User.aggregate([
    {
      $match: {
        userName: userName?.toLowerCase()
      }
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "channel",
        as: "subscribers"
      }
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "subscriber",
        as: "subscribed"
      }
    },
    {
      $addFields: {
        subscribersCount: {
          $size: "$subscribers"
        },
        subscribedCount: {
          $size: "$subscribed"
        },
        isSubscribed: {
          $cond: {
            if: { $in: [req.user?._id,"$subscribers.subscribe"]},
            then: true,
            else: false
          }
        }
      }
    },
    {
      $project: {
        username: 1,
        avatar: 1,
        subscribers: 1,
        subscribed: 1,
        isSubscribed: 1
      }
    }
  ])
  if (!channel.length) {
    throw new apiError(404,"channel not found.")
  }

  return res.status(200)
  .json(
    new apiResponse(
      200,
      channel[0],
      "User channel profile fetched successfully."
    )
  )
})

const getWatchHistory = asyncHandler(async(req,res) => {
  const user = await User.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(req.user._id)
      }
    },
    {
      $lookup: {
        from: "videos",
        localField: "watchHistory",
        foreignField: "_id",
        as: "watchHistory",
        pipeline: [
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
                  }
                }
              ]
            }
          },
          {
           $addFields: {
            owner: {
              $first: "$owner"
            }
           } 
          }
        ]
      }
    }
  ])

  res.status(200)
  .json(
    new apiResponse(
      200,
      user[0].watchHistory,
      "User watch history fetched successfully."
    )
  )
})

export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  passwordChange,
  getCurrentUser,
  updateUserDetails,
  updateAvatar,
  getUserChannelProfile,
  getWatchHistory
};
