const checkPostInteractions = require("@/helper/checkPostInteractions");
const { BookMark, User, Post, Topic } = require("@/models/index");
const { getBookMarkTargetByType } = require("@/utils/bookMarkTarget");

class BookMarksService {
  async getBookMarks(type, bookmarkAbleId) {
    getBookMarkTargetByType(type);

    const { rows: items, count: total } = await BookMark.findAndCountAll({
      where: {
        book_mark_able_id: bookmarkAbleId,
        book_mark_able_type: type,
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

  async getBookMarkedUserId(userId, type, page, limit) {
    const offset = (page - 1) * limit;
    const { model: Model } = getBookMarkTargetByType(type);

    const { rows: bookmarks, count: total } = await BookMark.findAndCountAll({
      where: {
        user_id: userId,
        book_mark_able_type: type,
      },
      limit,
      offset,
      attributes: ["book_mark_able_id", "created_at"],
    });

    if (bookmarks.length === 0) {
      return { bookMarks: [], total };
    }

    const bookmarkTimeMap = new Map();
    const ids = [];

    bookmarks.forEach((b) => {
      ids.push(b.book_mark_able_id);
      bookmarkTimeMap.set(b.book_mark_able_id, b.created_at);
    });

    const posts = await Model.findAll({
      where: { id: ids },
      include: [
        {
          model: User,
          as: "author",
          attributes: ["id", "full_name", "username", "avatar_url"],
        },
        {
          model: Topic,
          as: "topics",
          attributes: ["id", "name", "slug"],
        },
      ],
    });

    const interactions = await checkPostInteractions(ids, userId);

    const result = posts.map((post) => {
      const plain = post.get({ plain: true });
      const { isLiked, isBookMarked } = interactions.get(post.id) || {};
      plain.isLiked = isLiked || false;
      plain.isBookMarked = isBookMarked || false;
      plain.bookMarkedAt = bookmarkTimeMap.get(post.id);
      return plain;
    });

    return { bookMarks: result, total, limit };
  }

  async bookmark(userId, type, bookmarkAbleId) {
    const { model: Model, attributes } = getBookMarkTargetByType(type);
    const user = await User.findOne({ where: { id: userId } });
    const targetBookMark = await Model.findOne({
      where: { id: bookmarkAbleId },
    });
    if (!targetBookMark || !user) return false;

    const where = {
      user_id: userId,
      book_mark_able_type: type,
      book_mark_able_id: bookmarkAbleId,
    };

    const exists = await BookMark.findOne({
      where,
      attributes: ["id", "user_id", "book_mark_able_id", "book_mark_able_type"],
    });

    if (exists) {
      return false;
    }

    await BookMark.create(where);
    return true;
  }

  async unBookMark(userId, type, bookmarkAbleId) {
    const { model: Model, attributes } = getBookMarkTargetByType(type);

    const user = await User.findOne({ where: { id: userId } });
    const targetBookMark = await Model.findOne({
      where: { id: bookmarkAbleId },
    });
    if (!targetBookMark || !user) return false;

    const where = {
      user_id: userId,
      book_mark_able_type: type,
      book_mark_able_id: bookmarkAbleId,
    };
    const deleted = await BookMark.destroy({
      where: where,
    });
    return;
  }

  async check(userId, type, bookmarkAbleId) {
    const { model: Model, attributes } = getBookMarkTargetByType(type);

    const user = await User.findOne({ where: { id: userId } });
    const targetBookMark = await Model.findOne({
      where: { id: bookmarkAbleId },
    });
    if (!targetBookMark || !user) return false;

    const where = {
      user_id: userId,
      book_mark_able_type: type,
      book_mark_able_id: bookmarkAbleId,
    };

    const exits = await BookMark.findOne({
      where: where,
      attributes: ["id", "user_id", "book_mark_able_id", "book_mark_able_type"],
    });
    return !!exits;
  }

  async deleteAllBookMark(userId, type) {
    const result = await BookMark.destroy({
      where: { user_id: userId, book_mark_able_type: type },
    });
    return result;
  }
}

module.exports = new BookMarksService();
