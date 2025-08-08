const bookmarksService = require("@/services/book_mark.service");
const response = require("@/utils/response");

const getBookMarks = async (req, res) => {
  const { type, id } = req.params;

  try {
    const results = await bookmarksService.getBookMarks(type, id);
    return response.success(res, 200, results);
  } catch (error) {
    console.log(error);
    return response.error(
      res,
      400,
      "Lấy danh sách những người đánh dấu bài viết thất bại"
    );
  }
};

const getBookMarkedUserId = async (req, res) => {
  const { type, id } = req.params;
  const { page, limit } = req;

  try {
    const { bookMarks, total } = await bookmarksService.getBookMarkedUserId(
      id,
      type,
      page,
      limit
    );
    res.paginate({ items: bookMarks, total });
  } catch (error) {
    console.log(error);
    return response.error(
      res,
      400,
      "Lấy danh sách những người đang đánh dấu bài viết thất bại"
    );
  }
};

const bookmark = async (req, res) => {
  const { type, id } = req.params;
  const user = req.user;
  try {
    await bookmarksService.bookmark(user.id, type, id);
    return response.success(res, 200, "Đã đánh dấu bài viết thành công");
  } catch (error) {
    console.log(error);
    return response.error(res, 400, "Theo dõi thất bại");
  }
};

const unBookMark = async (req, res) => {
  const { type, id } = req.params;
  const user = req.user;
  try {
    await bookmarksService.unBookMark(user.id, type, id);
    return response.success(res, 204, "Đã hủy đánh dấu bài viết thành công");
  } catch (error) {
    console.log(error);
    return response.error(res, 400, "Hủy đánh dấu bài viết thất bại");
  }
};

const check = async (req, res) => {
  const { type, id } = req.params;
  const user = req.user;
  try {
    const isBookMark = await bookmarksService.check(user.id, type, id);
    return response.success(res, 200, isBookMark);
  } catch (error) {
    console.log(error);
    return response.error(
      res,
      400,
      "Lỗi kiểm tra trạng thái đánh dấu bài viết"
    );
  }
};

const deleteAllBookMark = async (req, res) => {
  const { type } = req.params;
  const user = req.user;
  try {
    const result = await bookmarksService.deleteAllBookMark(user.id, type);
    return response.success(res, 200, result);
  } catch (error) {
    console.log(error);
    return response.error(
      res,
      400,
      "Lỗi kiểm tra trạng thái đánh dấu bài viết"
    );
  }
};

module.exports = {
  getBookMarks,
  getBookMarkedUserId,
  bookmark,
  unBookMark,
  check,
  deleteAllBookMark,
};
