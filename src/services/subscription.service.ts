import { mongo } from "mongoose";
import { Subscription } from "../models/subscription.model.js";
import type { MongoId } from "../types/id.js";

async function toggleSubscription(subscriberId: MongoId, channelId: MongoId) {
  const subscription = await Subscription.deleteOne({
    subscriber: subscriberId,
    channel: channelId,
  });

  if (subscription.deletedCount === 0) {
    try {
      await Subscription.create({
        subscriber: subscriberId,
        channel: channelId,
      });
      return { success: true, subscriptionStatus: "Subscribed" };
    } catch (error) {
      if (error instanceof mongo.MongoServerError && error.code === 11000) {
        return { success: true, subscriptionStatus: "Subscribed" };
      }
      throw error;
    }
  }
  return {
    success: true,
    subscriptionStatus: "Unsubscribed",
  };
}

async function getSubscribedChannels(
  subscriberId: MongoId,
  channelId?: MongoId
) {
  const pipeline: Record<string, any>[] = [];

  pipeline.push({
    $match: { subscriber: { $lt: subscriberId } },
  });
}

export { toggleSubscription, getSubscribedChannels };
