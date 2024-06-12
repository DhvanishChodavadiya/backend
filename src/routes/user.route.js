import { Router } from "express";
import {
  getCurrentUser,
  getUserChannelProfile,
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

router.route("/changePassword").post(verifyJWT, passwordChange);

router.route("/fetchCurrentUser").post(verifyJWT, getCurrentUser);

router.route("/updateUserDetails").post(verifyJWT, updateUserDetails);

router.route("/updateAvatar").post(
  verifyJWT,
  upload.fields([
    {
      name: "avatar",
      maxCount: 1,
    },
  ]),
  updateAvatar
);

router.route("/getChannelProfile").post(getUserChannelProfile)

export default router;
