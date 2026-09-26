import { Router } from "express";
import {
  addComment,
  editComment,
  fetchComments,
  removeComment,
} from "../controllers/comment.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { validation } from "../middlewares/validation.middleware.js";
import {
  createCommentSchema,
  deleteCommentSchema,
  editCommentSchema,
  fetchCommentsSchema,
} from "../validators/comment.validator.js";

const commentRouter = Router();

commentRouter
  .route("/:videoId")
  .post(verifyJWT, validation(createCommentSchema), addComment);
commentRouter
  .route("")
  .get(verifyJWT, validation(fetchCommentsSchema), fetchComments);
commentRouter
  .route("/:commentId")
  .patch(verifyJWT, validation(editCommentSchema), editComment)
  .delete(verifyJWT, validation(deleteCommentSchema), removeComment);

export default commentRouter;
