const checkPostInteractions = require("@/helper/checkPostInteractions");
const incrementField = require("@/helper/incrementField");
const {
  Post,
  Topic,
  Comment,
  PostTopic,
  Tag,
  User,
  Sequelize,
} = require("@/models/index");
const { nanoid } = require("nanoid");
const { where, Op } = require("sequelize");
const { default: slugify } = require("slugify");

class PostsService {
  async getAll(page, limit, userId) {
    const offset = (page - 1) * limit;

    const { rows: posts, count: total } = await Post.findAndCountAll({
      include: [Topic, Comment],
      limit,
      offset,
      order: [["created_at", "DESC"]],
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
    return { items, total };
  }

  async featured(page, limit, userId) {
    const offset = (page - 1) * limit;

    const { rows: posts, count: total } = await Post.findAndCountAll({
      include: [
        {
          model: Topic,
          as: "topics",
        },
      ],
      limit,
      offset,
      order: [["like_count", "DESC"]],
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
    return { items, total };
  }

  async related(page, limit, prevTopics, userId) {
    const offset = (page - 1) * limit;

    const { rows: posts, count: total } = await Post.findAndCountAll({
      include: [
        {
          model: Topic,
          as: "topics",
          where: {
            name: {
              [Op.in]: prevTopics,
            },
          },
          required: true,
        },
      ],
      limit,
      offset,
      order: [["created_at", "DESC"]],
      distinct: true,
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

    return { items, total };
  }

  async latest(page, limit, userId) {
    const offset = (page - 1) * limit;

    const { rows: posts, count: total } = await Post.findAndCountAll({
      include: [
        {
          model: Topic,
          as: "topics",
        },
      ],
      limit,
      offset,
      order: [["created_at", "DESC"]],
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
    return { items, total };
  }

  async getByKey(key) {
    const isId = /^\d+$/.test(key);
    const post = await Post.findOne({
      where: isId ? { id: key } : { slug: key },
      include: [
        {
          model: User,
          as: "author",
          attributes: [
            "id",
            "avatar_url",
            "bio",
            "title",
            "full_name",
            "username",
            "social",
            "post_count",
            "follower_count",
            "following_count",
          ],
        },
        {
          model: Topic,
          as: "topics",
        },
        {
          model: Tag,
          as: "tags",
          attributes: ["name"],
        },
        {
          model: Comment,
          as: "comments",
          include: [
            {
              model: User,
              as: "author",
              attributes: ["avatar_url", "full_name"],
            },
          ],
        },
      ],
    });

    return post;
  }

  async create(data, user) {
    const toSlug = (title) => {
      return `${slugify(title, { lower: true, strict: true })}-${nanoid(6)}`;
    };
    if (!data.slug) {
      data.slug = toSlug(data.title);
    }
    data.author_id = user.id;
    data.author_name = user.full_name;
    data.author_username = user.username;
    data.author_avatar = user.avatar_url;

    const post = await Post.create(data);
    await Promise.all(
      data.topics.map((id) =>
        PostTopic.create({ post_id: post.id, topic_id: id })
      )
    );
    await incrementField(User, "post_count", +1, { id: user.id });
    await incrementField(Topic, "post_count", +1, {
      id: { [Op.in]: data.topics },
    });
    return post;
  }

  async update(key, data) {
    const toSlug = (title) => {
      return `${slugify(title, { lower: true, strict: true })}-${nanoid(6)}`;
    };
    if (data.title) {
      data.slug = toSlug(data.title);
    }
    const isId = /^\d+$/.test(key);
    const post = await Post.update(data, {
      where: isId ? { id: key } : { slug: key },
    });
    return post;
  }

  async remove(key, user) {
    const isId = /^\d+$/.test(key);

    const post = await Post.findOne({
      where: isId ? { id: key } : { slug: key },
      include: [
        {
          model: Topic,
          as: "topics",
          through: { attributes: [] },
        },
      ],
    });

    if (!post) throw new Error("Post not found");

    const topicIds = post.topics?.map((t) => t.id) || [];

    await PostTopic.destroy({ where: { post_id: post.id } });

    await Post.destroy({ where: { id: post.id } });

    await incrementField(User, "post_count", -1, { id: user.id });
    if (topicIds.length > 0) {
      await incrementField(Topic, "post_count", -1, {
        id: { [Op.in]: topicIds },
      });
    }

    return { message: "Post deleted successfully" };
  }

  async getUserPostForEdit(userId, slug) {
    const post = await Post.findOne({
      where: { author_id: userId, slug },
      attributes: [
        "title",
        "excerpt",
        "content",
        "cover_url",
        "thumbnail_url",
        "status",
        "visibility",
        "meta_title",
        "meta_description",
      ],
      include: [
        {
          model: Topic,
          as: "topics",
        },
      ],
    });
    return post;
  }
}

module.exports = new PostsService();
