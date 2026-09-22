import { Queue } from "bullmq";
import { config } from "../configs/queue.js";

const queueName = "cleanUp&interaction";
const dlq = new Queue(`${queueName}-dlq`, config);

export { dlq, queueName };
