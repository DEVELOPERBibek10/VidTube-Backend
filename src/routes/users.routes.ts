import { Router } from "express";
import {
  loginUser,
  registerUser,
  logoutUser,
  refreshAccessToken,
  getCurrentUser,
  updateDetails,
  updateAvatar,
  updateCoverImage,
  getUserChannelProfile,
} from "../controllers/users.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { validation } from "../middlewares/validation.middleware.js";

import {
  loginSchema,
  registerSchema,
  updateUserDetailSchema,
  userParamSchema,
  type UpdateUserSchema,
} from "../validators/user.validator.js";
import {
  fileRequestSchema,
  noRequestDataSchema,
} from "../validators/request.validator.js";

const userRouter = Router();

userRouter.route("/register").post(validation(registerSchema), registerUser);

userRouter.route("/login").post(validation(loginSchema), loginUser);
userRouter.route("/refresh-token").post(refreshAccessToken);

// secure route
userRouter
  .route("/logout")
  .post(verifyJWT, validation(noRequestDataSchema), logoutUser);
userRouter
  .route("/current-user")
  .get(verifyJWT, validation(noRequestDataSchema), getCurrentUser);
userRouter
  .route("/details")
  .patch(
    verifyJWT<UpdateUserSchema>,
    validation(updateUserDetailSchema),
    updateDetails
  );
userRouter
  .route("/avatar")
  .patch(
    verifyJWT,
    upload.single("avatar"),
    validation(fileRequestSchema),
    updateAvatar
  );
userRouter
  .route("/cover-image")
  .patch(
    verifyJWT,
    upload.single("coverImage"),
    validation(fileRequestSchema),
    updateCoverImage
  );
userRouter
  .route("/profile/:username")
  .get(verifyJWT, validation(userParamSchema), getUserChannelProfile);

export default userRouter;
