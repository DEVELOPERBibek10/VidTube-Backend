import { Worker, type Job } from "bullmq";
import { queueName } from "../queues/cleanUp.queue.js";
import { redisClientQueue } from "../configs/redis.js";
import cleanUp from "../utils/cleanUp.js";
import { dlq } from "../queues/dlq.queue.js";
import { Video } from "../models/video.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";

type CleanUpJobData = {
  deletionId: string;
};

const cleanUpWorker = new Worker(
  queueName,
  async (job: Job<CleanUpJobData>) => {
    if (job.id === `cascade-video-deletion-${job.data.deletionId}`) {
      await cleanUp(job.data.deletionId);
      await Video.findByIdAndDelete(job.data.deletionId);
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
    asyncHandler(async () => await addToDlq(job, err));
  }
});

const addToDlq = async (
  job: Job<CleanUpJobData>,
  err?: Error
): Promise<void> => {
  const isError = err && Object.keys(err).length > 0;
  if (isError) {
    console.error(`Clean up job failed for job ${job.id}:`, err.message);
  }
  if (job.attemptsMade === 4) {
    await dlq.add(`cascade-video-deletion-${job.data.deletionId}-dlq`, {
      jobId: job.id,
      name: job.name,
      data: job.data,
    });
  }
};

export default cleanUpWorker;
