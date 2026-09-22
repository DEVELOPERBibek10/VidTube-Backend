import { Redis } from "ioredis";

const isSecureConnection =
  process.env.UPSTASH_REDIS_URL?.startsWith("rediss://");

const redisClientCache = new Redis(process.env.UPSTASH_REDIS_URL!, {
  maxRetriesPerRequest: 3,
  enableReadyCheck: false,
  ...(isSecureConnection && { tls: { rejectUnauthorized: false } }),
});
const redisClientQueue = new Redis(process.env.REDIS_CLOUD_URL!, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
});
const listenRedis = async (client: Redis): Promise<Redis> => {
  return new Promise((resolve, reject) => {
    client.on("connect", () => {
      console.log(
        "Connected to Redis",
        client.options.host,
        client.options.port
      );
      resolve(client);
    });
    client.on("error", (err) => {
      console.error("Redis connection error:", err);
      reject(err);
    });
  });
};

export { redisClientCache, redisClientQueue, listenRedis };
