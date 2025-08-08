const pusher = require("@/configs/pusher");
const incrementField = require("@/helper/incrementField");
const { Comment, Post, User, Like, Sequelize } = require("@/models/index");
const { where, Op } = require("sequelize");

class CommentsService {
  async getPostComment(slug, page, limit, currentUserId) {
    const post = await Post.findOne({ where: { slug } });
    if (!post) throw new Error("Post not found");

    const offset = (page - 1) * limit;

    const parentComments = await Comment.findAll({
      where: {
        post_id: post.id,
        parent_id: null,
      },
      include: [
        {
          model: User,
          as: "author",
          attributes: ["id", "full_name", "avatar_url", "username"],
        },
      ],
      order: [["like_count", "ASC"]],
      limit,
      offset,
    });

    const parentIds = parentComments.map((c) => c.id);

    const replies = await Comment.findAll({
      where: {
        post_id: post.id,
        parent_id: parentIds.length > 0 ? parentIds : null,
      },
      include: [
        {
          model: User,
          as: "author",
          attributes: ["id", "full_name", "avatar_url", "username"],
        },
      ],
      order: [["like_count", "ASC"]],
    });

    const allComments = [...parentComments, ...replies];

    const commentIds = allComments.map((c) => c.id);
    let likedSet = new Set();
    if (currentUserId && commentIds.length > 0) {
      const liked = await Like.findAll({
        where: {
          user_id: currentUserId,
          like_able_id: commentIds,
          like_able_type: "comment",
        },
      });
      likedSet = new Set(liked.map((l) => l.like_able_id));
    }

    function buildCommentTree(comments, parentId = null) {
      return comments
        .filter((c) => c.parent_id === parentId)
        .map((c) => {
          const children = buildCommentTree(comments, c.id);
          return {
            ...c.toJSON(),
            isLiked: likedSet.has(c.id),
            isEdited:
              new Date(c.updated_at).getTime() -
                new Date(c.created_at).getTime() >
              1000,
            replies: children,
          };
        });
    }

    const tree = buildCommentTree(allComments);

    const total = await Comment.count({
      where: {
        post_id: post.id,
      },
    });

    return {
      comments: tree,
      total,
      page,
      limit,
    };
  }

  async getById(id) {
    const comment = await Comment.findOne({
      where: { id },
      include: [
        {
          model: User,
          as: "author",
        },
      ],
    });
    return comment;
  }

  async create(data, currentUserId) {
    const comment = await Comment.create(data);
    await comment.reload({
      include: [
        {
          model: User,
          as: "author",
          attributes: ["id", "full_name", "avatar_url"],
        },
        {
          model: Comment,
          as: "replies",
          attributes: ["id", "content", "user_id", "post_id"],
        },
      ],
    });
    comment.dataValues.isLiked = false;
    await incrementField(Post, "comment_count", +1, {
      id: comment.post_id,
    });
    comment.dataValues.author = {
      avatar: comment.author.avatar_url,
      name: comment.author.full_name,
    };

    comment.dataValues.createdAt = comment.created_at;
    comment.dataValues.likes = Number(comment.like_count);
    pusher.trigger(`post-${data.post_id}-comments`, "new-comment", comment);
    return comment;
  }

  async update(id, data) {
    const comment = await Comment.update(data, {
      where: {
        id,
      },
    });
    const updatedComment = await Comment.findByPk(id, {
      include: [
        {
          model: User,
          as: "author",
          attributes: ["id", "full_name", "avatar_url"],
        },
        {
          model: Comment,
          as: "replies",
          attributes: ["id", "content", "user_id", "post_id"],
        },
      ],
    });

    // Format thêm field nếu cần
    updatedComment.dataValues.isLiked = false;
    updatedComment.dataValues.author = {
      name: updatedComment.author.full_name,
      avatar: updatedComment.author.avatar_url,
    };
    updatedComment.dataValues.createdAt = updatedComment.created_at;
    updatedComment.dataValues.likes = Number(updatedComment.like_count);

    // Trigger sự kiện realtime
    pusher.trigger(
      `post-${updatedComment.post_id}-comments`,
      "updated-comment",
      updatedComment
    );
    return comment;
  }

  async remove(id) {
    const comment = await Comment.findByPk(id);
    await Comment.destroy({ where: { id } });
    await incrementField(Post, "comment_count", -1, { id: comment.post_id });
    pusher.trigger(
      `post-${comment.post_id}-comments`,
      "delete-comment",
      Number(id)
    );
    return comment;
  }
}

module.exports = new CommentsService();
