import { Subscription } from "../models/subscription.model.js";
import type { MongoId } from "../types/id.js";
import { executeTransaction } from "../utils/executeTransaction.js";
import { User } from "../models/user.model.js";
import { pageinationHelper } from "../utils/paginationHelper.js";
import type { PaginatedSubscriptionDocument } from "../types/Services/subscriber.js";
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
  channelId?: MongoId // cursor for pagination
) {
  const pipeline = [];
  const limit = 10;
  if (!channelId) {
    pipeline.push({
      $match: { subscriber: subscriberId },
    });
  } else {
    pipeline.push({
      $match: { subscriber: subscriberId, channel: { $lt: channelId } },
    });
  }
  pipeline.push(
    { $sort: { createdAt: -1 } },
    { $limit: limit + 1 },
    {
      $lookup: {
        from: "users",
        localField: "channel",
        foreignField: "_id",
        as: "channelDetails",
        pipeline: [
          {
            $addFields: {
              isSubscribed: true,
            },
          },
          {
            $project: {
              _id: 1,
              username: 1,
              avatar: 1,
              subscribers: 1,
              isSubscribed: 1,
            },
          },
        ],
      },
    },
    {
      $unwind: "$channelDetails",
    },
    {
      $project: {
        _id: 0,
        channelDetail: "$channelDetails",
        subscriber: 0,
      },
    }
  );

  const channels: PaginatedSubscriptionDocument[] =
    await Subscription.aggregate(pipeline as []);
  return pageinationHelper<PaginatedSubscriptionDocument["channelDetail"]>(
    channels.map((channel) => channel.channelDetail),
    limit,
    false
  );
}

export { toggleSubscription, getSubscribedChannels };
