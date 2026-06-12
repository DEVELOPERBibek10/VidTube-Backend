import { Redis } from "ioredis";

const redisClient = new Redis(
  process.env.REDIS_URL || "redis://localhost:6379"
);

const connectRedis = (): Promise<Redis> => {
  return new Promise((resolve, reject) => {
    redisClient.on("connect", () => {
      console.log("Connected to Redis");
      resolve(redisClient);
    });

    redisClient.on("error", (err) => {
      console.error("Redis connection error:", err);
      reject(err);
    });
  });
};

export { redisClient, connectRedis };
