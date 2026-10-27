import "dotenv/config";
import type { Server } from "node:http";
import connectDB from "./db/index.js";
import { redisClientCache, redisClientQueue } from "./configs/redis.js";
import { listenRedis } from "./configs/redis.js";
import app from "./app.js";
import { cleanUpQueue } from "./queues/cleanUp.queue.js";
import mongoose from "mongoose";
const port = process.env.PORT || 8000;
let httpServer: Server | undefined;
let isShuttingDown = false;

async function server() {
  try {
    const database = await Promise.all([
      connectDB(),
      listenRedis(redisClientCache),
      listenRedis(redisClientQueue),
    ]);
    if (database.every((db) => db)) {
      httpServer = app.listen(port, () => {
        console.log(`Server running on port: ${port}`);
      });
      httpServer.on("error", (err) => {
        console.error("EXPRESS SERVER FAILURE: Could not bind to port :", err);
        process.exit(1);
      });
    }
  } catch (error) {
    console.error("System boot halted due to database failure.", error);
    process.exit(1);
  }
}

async function gracefulShutdown(): Promise<void> {
  if (isShuttingDown) {
    return;
  }
  isShuttingDown = true;
  console.log("Graceful shutdown initiated...");
  try {
    if (httpServer) {
      await new Promise<void>((resolve, reject) => {
        httpServer!.close((error) => {
          if (error) {
            reject(error);
            return;
          }
          resolve();
        });
      });
    }
    await cleanUpQueue.close();
    await mongoose.connection.close();
    await Promise.all([redisClientCache.quit(), redisClientQueue.quit()]);
    console.log("Graceful shutdown completed.");
    process.exit(0);
  } catch (error) {
    console.error("Error during graceful shutdown:", error);
    process.exit(1);
  }
}

process.on("SIGINT", () => {
  void gracefulShutdown();
});
process.on("SIGTERM", () => {
  void gracefulShutdown();
});

await server();
