import { Video } from "../models/video.model.js";
import { cleanUpQueue } from "../queues/cleanUp.queue.js";
import { VideoDeletionStatus } from "../types/Model/Video.js";

async function recoverVideoDeletions(): Promise<void> {
  try {
    const videos = await Video.find({
      isDeleted: true,
      deletionStatus: {
        $in: [
          VideoDeletionStatus.PENDING,
          VideoDeletionStatus.IN_PROGRESS,
          VideoDeletionStatus.FAILED,
        ],
      },
    });
    if (videos.length === 0) {
      return;
    }
    await Promise.all(
      videos.map((video) =>
        cleanUpQueue.add(
          "cascade-video-deletion",
          { deletionId: video._id.toString() },
          { jobId: `cascade-video-deletion-${video._id.toString()}` }
        )
      )
    );
  } catch (error: unknown) {
    console.error("Error during deletion on boot:", error);
    throw error;
  }
}

export { recoverVideoDeletions };
