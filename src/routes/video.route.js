import { Router } from "express";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { getVideoById, publishVideo, updateVideoDetails } from "../controllers/video.controller.js";

const router = Router();

router.use(verifyJWT);

router.route("/publishVideo").post(
    upload.fields([
        {
            name: "videoFile",
            maxCount: 1
        },
        {
            name: "thumbnail",
            maxCount: 1
        }
    ]),
    publishVideo
)

router.route("/getVideoById/:videoId").get(getVideoById);

router.route("/updateVideoDetails/:videoId").patch(
    upload.single("thumbnail"),
    updateVideoDetails
);

export default router;