import { Worker, type Job } from "bullmq";
import { queueName } from "../queues/cleanUp.queue.js";
import { redisClientQueue } from "../configs/redis.js";
import cleanUp from "../services/videoDeletion.service.js";
import { Video } from "../models/video.model.js";
import { VideoDeletionStatus } from "../types/Model/Video.js";

type CleanUpJobData = {
  deletionId: string;
};

const cleanUpWorker = new Worker(
  queueName,
  async (job: Job<CleanUpJobData>) => {
    const video = await Video.findByIdAndUpdate(
      job.data.deletionId,
      { $set: { deletionStatus: VideoDeletionStatus.IN_PROGRESS } },
      { new: true }
    );

    if (!video) {
      console.error(`Video not found: ${job.data.deletionId}`);
      return job.name;
    }

    await cleanUp({
      videoId: job.data.deletionId,
      mediaId: {
        videoPublicId: video.videoFile.publicId,
        thumbnailPublicId: video.thumbnail.publicId,
      },
    });

    return job.name;
  },
  {
    connection: redisClientQueue,
    autorun: false,
    limiter: {
      max: 5,
      duration: 3000,
    },
  }
);
cleanUpWorker.on("failed", (job, error) => {
  if (!job) return;

  console.error(
    `Cleanup job ${job.id} failed on attempt ${job.attemptsMade}:`,
    error.message
  );
  const maxAttempts = job.opts.attempts ?? 1;
  if (job.attemptsMade < maxAttempts) return;

  void Video.findByIdAndUpdate(job.data.deletionId, {
    $set: { deletionStatus: VideoDeletionStatus.FAILED },
  }).catch((err: unknown) => {
    console.error(
      `Failed to update deletion status for video ${job.data.deletionId}:`,
      err
    );
  });
});
export default cleanUpWorker;
