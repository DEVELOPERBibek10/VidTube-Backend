import { Queue } from "bullmq";

const CleanUpQueue = new Queue("cleanup", {
  connection: {
    host: process.env.REDIS_URL || "localhost:6379",
  },
});

export default CleanUpQueue;
