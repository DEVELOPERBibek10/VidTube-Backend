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
  getWatchHistory,
} from "../controllers/users.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { validation } from "../middlewares/validation.middleware.js";

import {
  loginSchema,
  registerSchema,
  updateUserDetailSchema,
  userParamSchema,
} from "../validators/user.validator.js";

const userRouter = Router();

userRouter.route("/register").post(
  upload.fields([
    {
      name: "avatar",
      maxCount: 1,
    },
    {
      name: "coverImage",
      maxCount: 1,
    },
  ]),
  validation(registerSchema),
  registerUser
);

userRouter.route("/login").post(validation(loginSchema), loginUser);
userRouter.route("/refresh-token").post(refreshAccessToken);

// secure route
userRouter.route("/logout").post(verifyJWT, logoutUser);
userRouter.route("/current-user").get(verifyJWT, getCurrentUser);
userRouter
  .route("/details")
  .patch(verifyJWT, validation(updateUserDetailSchema), updateDetails);
userRouter
  .route("/avatar")
  .patch(verifyJWT, upload.single("avatar"), updateAvatar);
userRouter
  .route("/cover-image")
  .patch(verifyJWT, upload.single("coverImage"), updateCoverImage);
userRouter
  .route("/profile/:username")
  .get(verifyJWT, validation(userParamSchema), getUserChannelProfile);
userRouter.route("/watch-history").get(verifyJWT, getWatchHistory);

export default userRouter;
