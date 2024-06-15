import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
  addComment,
  deleteComment,
  getAllCommentsForVideo,
  updateComment,
} from "../controllers/comment.controller.js";

const router = Router();

router.use(verifyJWT);

router.route("/addComment/:videoId").post(addComment);

router.route("/updateComment/:commentId").patch(updateComment);

router.route("/deleteComment/:commentId").delete(deleteComment);

router.route("/getAllCommentsForVideo/:videoId").get(getAllCommentsForVideo);

export default router;
