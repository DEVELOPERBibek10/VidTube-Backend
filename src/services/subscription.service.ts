import { Subscription } from "../models/subscription.model.js";
import type { MongoId } from "../types/id.js";
import { executeTransaction } from "../utils/executeTransaction.js";
import { User } from "../models/user.model.js";
type SubscribeToggleReponse = {
  success: boolean;
  subscriptionStatus: "subscribed" | "unsubscribed";
};

async function toggleSubscription(subscriberId: MongoId, channelId: MongoId) {
  return await executeTransaction<SubscribeToggleReponse>(async (session) => {
    const unsubscribe = await Subscription.deleteOne({
      subscriber: subscriberId,
      channel: channelId,
    }).session(session);
    if (unsubscribe.deletedCount === 0) {
      await Subscription.create(
        [
          {
            subscriber: subscriberId,
            channel: channelId,
          },
        ],
        { session }
      );
      await User.updateOne(
        { _id: channelId },
        { $inc: { subscribers: 1 } }
      ).session(session);

      return {
        success: true,
        subscriptionStatus: "subscribed",
      };
    }
    await User.updateOne(
      { _id: channelId, subscribers: { $gt: 0 } },
      { $inc: { subscribers: -1 } }
    ).session(session);

    return {
      success: true,
      subscriptionStatus: "unsubscribed",
    };
  });
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
