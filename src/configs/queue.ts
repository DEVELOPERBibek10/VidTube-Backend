import { redisClientQueue } from "./redis.js";

const config = {
  connection: redisClientQueue,
  defaultJobOptions: {
    removeOnComplete: true,
    removeOnFail: {
      age: 6 * 3600,
    },
    retries: 3,
    backoff: {
      type: "exponential",
      delay: 2000,
    },
  },
};

export { config };
