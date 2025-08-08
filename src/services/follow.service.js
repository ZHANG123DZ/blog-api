const pusher = require("@/configs/pusher");
const incrementField = require("@/helper/incrementField");
const { Follow, User, Post, Notification } = require("@/models/index");
const { getFollowTargetByType } = require("@/utils/followTarget");

class FollowsService {
  async getFollowers(type, followAbleId) {
    getFollowTargetByType(type);

    const { rows: items, count: total } = await Follow.findAndCountAll({
      where: {
        follow_able_id: followAbleId,
        follow_able_type: type,
      },
      attributes: ["user_id"],
    });

    const ids = items.map((f) => f.user_id);
    if (ids.length === 0) {
      return { data: [], total };
    }

    const users = await User.findAll({
      where: { id: ids },
      attributes: ["id", "username", "avatar_url", "full_name"],
    });
    return { users, total };
  }

  async getFollowing(userId, type) {
    const { model: Model, attributes } = getFollowTargetByType(type);

    const { rows: items, count: total } = await Follow.findAndCountAll({
      where: {
        user_id: userId,
        follow_able_type: type,
      },
      attributes: ["follow_able_id"],
    });

    const ids = items.map((f) => f.follow_able_id);
    if (ids.length === 0) {
      return { data: [], total };
    }

    const users = await Model.findAll({
      where: { id: ids },
      attributes,
    });
    return { users, total };
  }

  async follow(userId, type, followAbleId) {
    const { model: Model, attributes } = getFollowTargetByType(type);
    const targetFollow = await Model.findOne({ where: { id: followAbleId } });
    if (!targetFollow || !userId) return false;

    const where = {
      user_id: userId,
      follow_able_type: type,
      follow_able_id: followAbleId,
    };

    const exists = await Follow.findOne({
      where,
      attributes: ["id", "user_id", "follow_able_id", "follow_able_type"],
    });

    if (exists) {
      return false;
    }
    await Follow.create(where);
    await incrementField(Model, "follower_count", +1, { id: followAbleId });
    const notify = await Notification.create({
      type: "follow",
      user_id: followAbleId,
      notifiable_id: userId,
      notifiable_type: "User",
      created_at: new Date(),
      updated_at: new Date(),
    });
    pusher.trigger(
      `notifications-user-${followAbleId}`,
      "new-notification",
      notify
    );
    return true;
  }

  async unfollow(userId, type, followAbleId) {
    const { model: Model, attributes } = getFollowTargetByType(type);

    const user = await User.findOne({ where: { id: userId } });
    const targetFollow = await Model.findOne({ where: { id: followAbleId } });
    if (!targetFollow || !user) return false;

    const where = {
      user_id: userId,
      follow_able_type: type,
      follow_able_id: followAbleId,
    };
    await Follow.destroy({
      where: where,
    });
    await incrementField(Model, "follower_count", -1, { id: followAbleId });
    return;
  }

  async check(userId, type, followAbleId) {
    const { model: Model, attributes } = getFollowTargetByType(type);

    const user = await User.findOne({ where: { id: userId } });
    const targetFollow = await Model.findOne({ where: { id: followAbleId } });
    if (!targetFollow || !user) return false;

    const where = {
      user_id: userId,
      follow_able_type: type,
      follow_able_id: followAbleId,
    };

    const exits = await Follow.findOne({
      where: where,
      attributes: ["id", "user_id", "follow_able_id", "follow_able_type"],
    });
    return !!exits;
  }
}
module.exports = new FollowsService();
