const response = require("@/utils/response");
const accessToken = require("@/utils/accessToken");
const { User } = require("@/models");

module.exports = async (req, res, next) => {
  const token = req.cookies.token;

  if (!token) {
    return response.error(res, 401, "Bạn chưa đăng nhập hoặc đăng ký");
  }

  try {
    const decoded = accessToken.verify(token);

    const user = await User.findByPk(decoded?.sub);
    const userData = user?.dataValues;
    if (
      !userData ||
      userData.status === "banned" ||
      userData.status === "inactive"
    ) {
      return response.error(res, 403, "Tài khoản không hợp lệ hoặc đã bị khóa");
    }
    req.user = userData;
    next();
  } catch (error) {
    console.error(error);
    return response.error(res, 401, "Token không hợp lệ");
  }
};
