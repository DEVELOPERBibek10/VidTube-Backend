import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
  deleteVideo,
  getAllVideos,
  getSuggestions,
  getVideoSignature,
  searchVideos,
  updateThumbnail,
  updateVideoDetails,
  uploadVideo,
} from "../controllers/video.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { validation } from "../middlewares/validation.middleware.js";
import {
  updateVideoParamsSchema,
  updateVideoSchema,
  videoRequestSchema,
  videoQuerySchema,
  getSuggestionsSchema,
  videoSearchQuerySchema,
  type UpdateVideoSchema,
  type VideoUploadSchema,
} from "../validators/video.validator.js";
import {
  thumbnailSchema,
  noRequestDataSchema,
} from "../validators/file.validator.js";

const videoRouter = Router();

videoRouter
  .route("/signature")
  .get(verifyJWT, validation(noRequestDataSchema), getVideoSignature);
videoRouter
  .route("/upload")
  .post(
    verifyJWT<VideoUploadSchema>,
    upload.single("thumbnail"),
    validation(videoRequestSchema),
    uploadVideo
  );
videoRouter
  .route("/details/:videoId")
  .patch(
    verifyJWT<UpdateVideoSchema>,
    validation(updateVideoParamsSchema),
    validation(updateVideoSchema),
    updateVideoDetails
  );
videoRouter
  .route("/thumbnail/:videoId")
  .patch(
    verifyJWT,
    validation(updateVideoParamsSchema),
    upload.single("thumbnail"),
    validation(thumbnailSchema),
    updateThumbnail
  );
videoRouter
  .route("/:videoId")
  .delete(verifyJWT, validation(updateVideoParamsSchema), deleteVideo);
videoRouter
  .route("")
  .get(verifyJWT, validation(videoQuerySchema), getAllVideos);
videoRouter
  .route("/suggestions")
  .get(verifyJWT, validation(getSuggestionsSchema), getSuggestions);
videoRouter
  .route("/search")
  .get(verifyJWT, validation(videoSearchQuerySchema), searchVideos);

export default videoRouter;
