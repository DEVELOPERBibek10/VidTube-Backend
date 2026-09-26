import { Router } from "express";
import {
  fetchWatchHistory,
  removeHistoryItem,
  saveWatchHistory,
} from "../controllers/watchHistory.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { validation } from "../middlewares/validation.middleware.js";
import {
  createWatchHistorySchema,
  deleteWatchHistorySchema,
  fetchWatchHistorySchema,
} from "../validators/watchHistory.validator.js";

const watchHistoryRouter = Router();

watchHistoryRouter
  .route("")
  .post(verifyJWT, validation(createWatchHistorySchema), saveWatchHistory)
  .get(verifyJWT, validation(fetchWatchHistorySchema), fetchWatchHistory);

watchHistoryRouter
  .route("/:historyId")
  .delete(
    verifyJWT,
    validation(deleteWatchHistorySchema),
    removeHistoryItem
  );

export default watchHistoryRouter;
