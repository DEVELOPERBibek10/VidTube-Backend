import "dotenv/config";
import mongoose from "mongoose";
import connectDB from "./db/index.js";
import { listenRedis, redisClientQueue } from "./configs/redis.js";
import cleanUpWorker from "./workers/cleanUp.worker.js";
import { recoverVideoDeletions } from "./services/recoverVideoDeletions.service.js";
import { scheduleVideoDeletions } from "./schedulers/videoDeletion.scheduler.js";

let isShuttingDown = false;

async function startWorker() {
  const database = await Promise.all([
    connectDB(),
    listenRedis(redisClientQueue),
  ]);
  if (database.every((db) => db)) {
    await cleanUpWorker.run();
    await recoverVideoDeletions();
    await scheduleVideoDeletions();
  }
}

async function gracefulShutdown(): Promise<void> {
  if (isShuttingDown) {
    return;
  }
  isShuttingDown = true;
  console.log("Graceful shutdown initiated...");
  try {
    await cleanUpWorker.close();
    await mongoose.connection.close();
    await redisClientQueue.quit();

    console.log("Graceful shutdown completed.");
    process.exit(0);
  } catch (error) {
    console.error("Error during graceful shutdown:", error);
    process.exit(1);
  }
}

process.on("SIGINT", () => void gracefulShutdown());
process.on("SIGTERM", () => void gracefulShutdown());

try {
  await startWorker();
} catch (error) {
  console.error("Worker startup failed:", error);
  process.exit(1);
}
