const checkPostInteractions = require("@/helper/checkPostInteractions");
const { Topic, Post } = require("@/models/index");
const { where, Op } = require("sequelize");

class TopicService {
  async getAll(page, limit) {
    const offset = (page - 1) * limit;

    const { rows: items, count: total } = await Topic.findAndCountAll({
      limit,
      offset,
      order: [["created_at", "DESC"]],
    });

    return { items, total };
  }

  async getById(slug, userId) {
    const topic = await Topic.findOne({
      where: { slug },
      include: [{ model: Post, as: "posts" }],
    });

    if (!topic) return null;

    const postIds = topic.posts.map((p) => p.id);
    const interactions = await checkPostInteractions(postIds, userId);

    const plainTopic = topic.get({ plain: true });
    plainTopic.posts = plainTopic.posts.map((post) => {
      const { isLiked = false, isBookMarked = false } =
        interactions.get(post.id) || {};
      return { ...post, isLiked, isBookMarked };
    });

    return plainTopic;
  }

  async create(data) {
    const topic = await Topic.create(data);
    return topic;
  }

  async update(slug, data) {
    const topic = await Topic.update(data, {
      where: {
        slug,
      },
    });
    return topic;
  }

  async remove(slug) {
    const topic = await Topic.destroy({ where: { slug } });
    return topic;
  }
}

module.exports = new TopicService();
