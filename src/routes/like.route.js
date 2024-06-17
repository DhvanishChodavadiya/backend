import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
  getAllLikedVideos,
  toggleCommentLike,
  toggleTweetLike,
  toggleVideoLike,
} from "../controllers/like.controller.js";

const router = Router();

router.use(verifyJWT);

router.route("/toggleVideoLikeStatus/:videoId").post(toggleVideoLike);

router.route("/toggleCommentLikeStatus/:commentId").post(toggleCommentLike);

router.route("/toggleTweetLikeStatus/:tweetId").post(toggleTweetLike);

router.route("/getAllLikedVideos").get(getAllLikedVideos);

export default router;
