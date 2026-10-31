import { Video } from "../models/video.model.js";
import { cleanUpQueue } from "../queues/cleanUp.queue.js";
import { VideoDeletionStatus } from "../types/Model/Video.js";

async function scheduleVideoDeletions(): Promise<void> {
  const staleInProgressCutoff = new Date(Date.now() - 10 * 60 * 1000);
  const videos = await Video.find({
    deletedAt: { $ne: null },
    $or: [
      { deletionStatus: VideoDeletionStatus.PENDING },
      {
        deletionStatus: VideoDeletionStatus.IN_PROGRESS,
        deletedAt: { $lt: staleInProgressCutoff },
      },
    ],
  })
    .select("_id")
    .lean();

  if (videos.length === 0) {
    return;
  }

  await Promise.all(
    videos.map((video) =>
      cleanUpQueue.upsertJobScheduler(
        "reschedule-video-deletion-scheduler",
        { pattern: "0 0 2 * *" },
        {
          name: "reschedule-video-deletion",
          data: { deletionId: video._id.toString() },
          opts: {
            removeOnComplete: true,
            removeOnFail: true,
          },
        }
      )
    )
  );
}

export { scheduleVideoDeletions };
