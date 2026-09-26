import { Router } from "express";
import {
  toggleLikeOnComment,
  toggleLikeOnVideo,
} from "../controllers/like.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { validation } from "../middlewares/validation.middleware.js";
import {
  commentLikeSchema,
  videoLikeSchema,
} from "../validators/like.validator.js";

const likeRouter = Router();

likeRouter
  .route("/video/:videoId")
  .post(verifyJWT, validation(videoLikeSchema), toggleLikeOnVideo);

likeRouter
  .route("/comment/:commentId")
  .post(verifyJWT, validation(commentLikeSchema), toggleLikeOnComment);

export default likeRouter;
