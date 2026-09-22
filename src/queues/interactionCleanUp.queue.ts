import { Queue } from "bullmq";
import { config } from "../configs/queue.js";

const queueName = "userInteractionCleanUpQueue";

const interactionCleanUpQueue = new Queue(queueName, config);

export { interactionCleanUpQueue, queueName };
