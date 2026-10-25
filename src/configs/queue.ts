import { redisClientQueue } from "./redis.js";

const config = {
  connection: redisClientQueue,
  defaultJobOptions: {
    removeOnComplete: true,
    removeOnFail: {
      age: 6 * 3600,
    },
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 3000,
    },
  },
};

export { config };
