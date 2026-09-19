import { Queue } from "bullmq";

const cleanUpQueue = new Queue("cleanUpQueue", {
  connection: {
    host: process.env.REDIS_CLOUD_URL || "localhost",
  },
});

export default cleanUpQueue;
