import { Router } from "express";
import {
  getCurrentUser,
  getUserChannelProfile,
  getWatchHistory,
  loginUser,
  logoutUser,
  passwordChange,
  refreshAccessToken,
  registerUser,
  updateAvatar,
  updateUserDetails,
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/register").post(
  upload.fields([
    {
      name: "avatar",
      maxCount: 1,
    },
  ]),
  registerUser
);

router.route("/login").post(loginUser);

router.route("/logout").post(verifyJWT, logoutUser);

router.route("/refreshToken").post(refreshAccessToken);

router.route("/changePassword").patch(verifyJWT, passwordChange);

router.route("/fetchCurrentUser").get(verifyJWT, getCurrentUser);

router.route("/updateUserDetails").patch(verifyJWT, updateUserDetails);

router.route("/updateAvatar").patch(
  verifyJWT,
  upload.single("avatar"),
  updateAvatar
);

router.route("/getChannelProfile/:userName").get(verifyJWT,getUserChannelProfile)

router.route("/watchHistory").get(verifyJWT,getWatchHistory)

export default router;
