import { Worker, type Job } from "bullmq";
import { queueName } from "../queues/cleanUp.queue.js";
import { redisClientQueue } from "../configs/redis.js";
import cleanUp from "../utils/cleanUp.js";
import { Video } from "../models/video.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";

type CleanUpJobData = {
  deletionId: string;
};

const cleanUpWorker = new Worker(
  queueName,
  async (job: Job<CleanUpJobData>) => {
    if (job.id === `cascade-video-deletion-${job.data.deletionId}`) {
      await Video.findByIdAndDelete(job.data.deletionId);
      await cleanUp(job.data.deletionId);
      return job.name;
    }
  },
  {
    connection: redisClientQueue,
    limiter: {
      max: 5,
      duration: 3000,
    },
  }
);
cleanUpWorker.on("failed", (job, err) => {
  if (job) {
    asyncHandler(() => throwError(job, err));
  }
});

function throwError(job: Job<CleanUpJobData>, err: Error) {
  if (job.attemptsMade === 4) {
    console.error(`Job ${job.id}. Error: ${err.message}`);
    throw new ApiError(
      500,
      "DELETION_FAILED",
      `Failed to delete video with ID ${job.data.deletionId}.`
    );
  }
}
export default cleanUpWorker;
