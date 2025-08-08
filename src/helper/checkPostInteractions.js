require("module-alias/register");
const { Op } = require("sequelize");
const { Like, BookMark } = require("@/models");

/**
 * Kiểm tra like & bookmark của user đối với list bài viết
 * @param {Array<number>} postIds - Mảng ID bài viết
 * @param {number} userId - ID của user hiện tại
 * @returns {Promise<Map<number, { isLiked: boolean, isBookMarked: boolean }>>}
 */
async function checkPostInteractions(postIds, userId) {
  if (!postIds.length || !userId) {
    return new Map();
  }

  const likes = await Like.findAll({
    where: {
      user_id: userId,
      like_able_type: "post",
      like_able_id: { [Op.in]: postIds },
    },
    attributes: ["like_able_id"],
    raw: true,
  });
  const likedPostIds = new Set(likes.map((l) => l.like_able_id));

  const bookmarks = await BookMark.findAll({
    where: {
      user_id: userId,
      book_mark_able_type: "post",
      book_mark_able_id: { [Op.in]: postIds },
    },
    attributes: ["book_mark_able_id"],
    raw: true,
  });
  const bookmarkedPostIds = new Set(bookmarks.map((b) => b.book_mark_able_id));

  const result = new Map();
  postIds.forEach((id) => {
    result.set(id, {
      isLiked: likedPostIds.has(id),
      isBookMarked: bookmarkedPostIds.has(id),
    });
  });

  return result;
}

module.exports = checkPostInteractions;
