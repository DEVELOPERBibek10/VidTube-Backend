import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";

const app = express();

app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);

app.use(express.json({ limit: "20kb" }));
app.use(express.urlencoded({ extended: true, limit: "20kb" }));
app.use(express.static("public"));
app.use(cookieParser());

// router imports

import userRouter from "./routes/users.routes.js";
import globalErrorHandler from "./middlewares/error.middleware.js";
import videoRouter from "./routes/videos.routes.js";
import { healthRouter } from "./routes/health.routes.js";
import likeRouter from "./routes/likes.routes.js";
import commentRouter from "./routes/comments.routes.js";
import watchHistoryRouter from "./routes/watchHistory.routes.js";

app.use("/api/v1/user", userRouter);
app.use("/api/v1/video", videoRouter);
app.use("/api/v1/like", likeRouter);
app.use("/api/v1/comment", commentRouter);
app.use("/api/v1/watch-history", watchHistoryRouter);
app.use("/api/v1", healthRouter);
app.use(globalErrorHandler);

export default app;
