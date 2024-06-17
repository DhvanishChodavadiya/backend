import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
  addVideoToPlaylist,
  createPlayList,
  deletePlaylist,
  getPlaylistById,
  removeVideoFromPlaylist,
  updatePlaylistInfo,
  userPlaylists,
} from "../controllers/playlist.controller.js";

const router = Router();

router.use(verifyJWT);

router.route("/createPlaylist").post(createPlayList);

router.route("/getUsersAllPlaylist/:userId").get(userPlaylists);

router.route("/getPlaylistById/:playlistId").get(getPlaylistById);

router
  .route("/addVideoToPlaylist/:playlistId/:videoId")
  .patch(addVideoToPlaylist);

router
  .route("/removeVideoFromPlaylist/:playlistId/:videoId")
  .patch(removeVideoFromPlaylist);

router.route("/deletePlaylist/:playlistId").delete(deletePlaylist);

router.route("/updatePlaylistInfo/:playlistId").patch(updatePlaylistInfo)

export default router;
