import { Queue } from "bullmq";
import { config } from "../configs/queue.js";
const queueName = "cleanUpQueue";

const cleanUpQueue = new Queue(queueName, config);

export { cleanUpQueue, queueName };
