const { User, Post, Comment, Notification } = require("@/models/index");

class NotificationService {
  async getNotify(page, limit, userId) {
    const offset = (page - 1) * limit;

    const { rows: items, count: total } = await Notification.findAndCountAll({
      where: { user_id: userId },
      limit,
      offset,
      order: [["created_at", "DESC"]],
      include: [
        {
          model: Post,
          as: "post",
          attributes: ["id", "title", "slug", "cover_url"],
          required: false,
        },
        {
          model: Comment,
          as: "comment",
          attributes: ["id", "content", "post_id"],
          include: [
            {
              model: Post,
              as: "post",
              attributes: ["id", "title", "slug"],
            },
          ],
          required: false,
        },
        {
          model: User,
          as: "follower",
          attributes: ["id", "full_name", "username", "avatar_url"],
          required: false,
        },
      ],
    });

    const mappedItems = items.map((n) => {
      const notify = n.get({ plain: true });
      let message = "";
      let link = "";

      switch (notify.type) {
        case "like":
          if (notify.post) {
            message = `${
              notify.follower?.full_name || "Someone"
            } liked your post "${notify.post.title}"`;
            link = `/blog/${notify.post.slug}`;
          }
          break;

        case "new_comment":
          if (notify.comment?.post) {
            message = `${
              notify.follower?.full_name || "Someone"
            } commented on your post "${notify.comment.post.title}"`;
            link = `/blog/${notify.comment.post.slug}`;
          }
          break;

        case "follow":
          if (notify.follower) {
            message = `${notify.follower.full_name} started following you`;
            link = `/profile/${notify.follower.username}`;
          }
          break;

        case "new_post":
          if (notify.post) {
            message = `${
              notify.follower?.full_name || "Someone"
            } created a new post "${notify.post.title}"`;
            link = `/blog/${notify.post.slug}`;
          }
          break;

        default:
          message = "You have a new notification";
          link = "/";
          break;
      }

      return {
        id: notify.id,
        type: notify.type,
        message,
        link,
        read: !!notify.read_at,
        createdAt: notify.created_at,
      };
    });

    return { items: mappedItems, total };
  }

  async update(data, id) {
    await Notification.update(data, { where: { id } });
    return;
  }

  async readAll(userId) {
    await Notification.update(
      { read_at: new Date() },
      { where: { user_id: userId } }
    );
    return;
  }
}

module.exports = new NotificationService();
