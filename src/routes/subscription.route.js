import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { getUserChannelSubscribers, getUsersSubscribedChannels, toggleSubscription } from "../controllers/subscription.controller.js";

const router = Router();

router.use(verifyJWT);

router.route("/toggleSubscription/:channelId").post(toggleSubscription);

router.route("/getChannelSubscribers/:channelId").get(getUserChannelSubscribers);

router.route("/getUsersSubscribedChannels/:subscriberId").get(getUsersSubscribedChannels);

export default router;