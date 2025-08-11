const pusher = require("@/configs/pusher");
const checkPostInteractions = require("@/helper/checkPostInteractions");
const {
  User,
  Post,
  UserSkill,
  Skill,
  UserBadge,
  Badge,
  Topic,
  Follow,
} = require("@/models/index");

class UsersService {
  async getAll(page, limit) {
    const offset = (page - 1) * limit;

    const { rows: items, count: total } = await User.findAndCountAll({
      limit,
      offset,
      order: [["created_at", "DESC"]],
      attributes: ["id", "username", "avatar_url", "full_name"],
    });

    return { items, total };
  }

  async getByKey(key) {
    const isId = /^\d+$/.test(key);
    const user = await User.findOne({
      where: isId ? { id: key } : { username: key },
      include: [
        {
          model: Skill,
          as: "skillList",
        },
        {
          model: Badge,
          as: "badgeList",
        },
      ],
      attributes: [
        "id",
        "username",
        "full_name",
        "first_name",
        "last_name",
        "avatar_url",
        "cover_url",
        "title",
        "bio",
        "post_count",
        "follower_count",
        "following_count",
        "like_count",
        "location",
        "website",
        "created_at",
        "social",
      ],
    });

    return user;
  }

  async getUserPosts(key, page, limit, userId) {
    const isId = /^\d+$/.test(key);
    const user = await User.findOne({
      where: isId ? { id: key } : { username: key },
      attributes: ["id", "username", "avatar_url", "full_name"],
    });
    if (!user) throw new Error("User not found");
    const offset = (page - 1) * limit;
    const { rows: posts, count: total } = await Post.findAndCountAll({
      where: { author_id: user.id },
      order: [["created_at", "DESC"]],
      limit,
      offset,
      attributes: [
        "id",
        "title",
        "excerpt",
        "slug",
        "cover_url",
        "thumbnail_url",
        "status",
        "author_id",
        "author_name",
        "author_avatar",
        "author_username",
        "created_at",
        "view_count",
        "like_count",
        "comment_count",
        "published_at",
        "reading_time",
      ],
      distinct: true,
      include: [
        {
          model: Topic,
          as: "topics",
        },
      ],
    });
    const postIds = posts.map((p) => p.id);

    const interactions = await checkPostInteractions(postIds, userId);

    const items = posts.map((post) => {
      const plain = post.get({ plain: true });
      const { isLiked, isBookMarked } = interactions.get(post.id) || {};
      plain.isLiked = isLiked || false;
      plain.isBookMarked = isBookMarked || false;
      return plain;
    });

    return { items, limit, total };
  }

  async create(data) {
    const user = await User.create(data);
    return user;
  }

  async update(key, data) {
    const isId = /^\d+$/.test(key);
    const user = await User.update(data, {
      where: isId ? { id: key } : { username: key },
    });
    return user;
  }

  async remove(key) {
    const isId = /^\d+$/.test(key);
    const user = await User.destroy({
      where: isId ? { id: key } : { username: key },
    });
    return user;
  }

  async setUserOnline(userId) {
    await User.update({ last_seen: null }, { where: { id: userId } });

    return {
      userId,
      online: true,
    };
  }

  async setUserOffline(userId) {
    await User.update({ last_seen: new Date() }, { where: { id: userId } });

    const user = await User.findOne({
      where: { id: userId },
      attributes: ["last_seen"],
    });

    return {
      userId,
      online: false,
      last_seen: user?.last_seen || null,
    };
  }

  async getUserStatus(username) {
    const user = await User.findOne({
      where: { username },
      attributes: ["last_seen"],
    });

    return {
      username,
      online: user?.last_seen === null,
      last_seen: user?.last_seen || null,
    };
  }
}

module.exports = new UsersService();
