import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';

const app = express();

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}))

app.use(express.json({limit: "16kb"}))
app.use(express.urlencoded({extended: true,limit: "16kb"}))
app.use(express.static("public"))
app.use(cookieParser())

import userRouter from './routes/user.route.js';
app.use("/api/v1/user",userRouter)

import videoRouter from "./routes/video.route.js";
app.use("/api/v1/video",videoRouter);

import commentRouter from "./routes/comment.route.js";
app.use("/api/v1/comment",commentRouter);

import likeRouter from "./routes/like.route.js";
app.use("/api/v1/like",likeRouter);

import playlistRouter from "./routes/playlist.route.js";
app.use("/api/v1/playlist",playlistRouter);

import subscriptionRouter from "./routes/subscription.route.js";
app.use("/api/v1/subscription",subscriptionRouter);

import tweetRouter from "./routes/tweet.route.js";
app.use("/api/v1/tweet",tweetRouter);

export {app}