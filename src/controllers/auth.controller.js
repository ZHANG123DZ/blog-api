const response = require("@/utils/response");

const authService = require("@/services/auth.service");
const { createCookie, readCookie } = require("@/utils/cookie");
const accessToken = require("@/utils/accessToken");
const refreshToken = require("@/utils/refreshToken");

const queue = require("@/utils/queue");
const emailToken = require("@/utils/emailToken");
const usersService = require("@/services/user.service");
const forgotPasswordToken = require("@/utils/forgotPasswordToken");

const auth = async (req, res) => {
  try {
    const token = readCookie(req, "token");
    if (!token) {
      return response.error(res, 401, "Token không hợp lệ hoặc hết hạn");
    }

    const user = await authService.auth(token);
    if (!user) {
      return response.error(res, 401, "Token không hợp lệ hoặc hết hạn");
    }
    return response.success(res, 200, user);
  } catch (error) {
    return response.error(res, 401, "Không xác thực được người dùng này");
  }
};

const refreshTok = async (req, res) => {
  try {
    const refreshTok = readCookie(req, "refresh-token");
    const user = await authService.refreshTok(refreshTok);
    const newAccessToken = accessToken.create({ sub: user.id });
    const newRefreshToken = refreshToken.create({ sub: user.id });

    if (!newRefreshToken || !newAccessToken) {
      response.error(res, 500, "Không tạo được token vui lòng đăng nhập lại");
    }
    createCookie(res, "token", newAccessToken);
    createCookie(res, "refresh-token", newRefreshToken);
    return response.success(res, 200, "Refresh Token thành công");
  } catch (error) {
    return response.error(res, 401, "Refresh token that bai");
  }
};

const login = async (req, res) => {
  try {
    const data = req.body;
    const { rememberMe, ...dataLogin } = data;
    const user = await authService.login(dataLogin);
    const token = accessToken.create({ sub: user.id });

    if (rememberMe) {
      const refreshTok = refreshToken.create({ sub: user.id });
      if (!refreshTok) {
        response.error(
          res,
          500,
          "Không tạo được refresh token vui lòng đăng nhập lại"
        );
      }
      createCookie(res, "refresh-token", refreshTok);
    }

    if (!token) {
      return response.error(
        res,
        500,
        "Không tạo được token vui lòng đăng nhập lại"
      );
    }

    createCookie(res, "token", token);
    return response.success(res, 200, user);
  } catch (error) {
    return response.error(res, 401, "Dang nhap that bai");
  }
};

const checkUsername = async (req, res) => {
  const data = req.body;

  const auth = await authService.checkUsername(data);
  if (auth) {
    return response.success(res, 200, auth);
  }
  response.error(res, 409);
};

const register = async (req, res) => {
  const { ...data } = req.body;
  try {
    //auto generate userID
    const user = await authService.register(data);
    const token = accessToken.create({ sub: user.id });
    if (!token) {
      return response.error(res, 500, "Không tạo được token vui lòng thử lại");
    }

    queue.dispatch("sendVerifyEmailJob", {
      userId: user.id,
    });

    createCookie(res, "token", token);
    return response.success(res, 200, user);
  } catch (error) {
    console.log(error);
    return response.error(res, 401, "Dang ky that bai");
  }
};

const sendForgotEmail = async (req, res) => {
  const data = req.body;
  try {
    const user = await authService.sendForgotEmail(data.email);
    const token = forgotPasswordToken.create({ sub: user.id });

    queue.dispatch("sendForgotPasswordJob", {
      userId: user.id,
      email: user.email,
      token,
    });
    return response.success(res, 200, user);
  } catch (error) {
    console.log(error);
    return response.error(res, 401, "Thông tin email không đúng!");
  }
};

const resetPassword = async (req, res) => {
  const data = req.body;

  if (!data) {
    return response.error(res, 401, "Không xác thực được người dùng");
  }
  try {
    const payload = forgotPasswordToken.verify(data.token);

    const user = await authService.resetPassword(payload.sub, data.password);
    return response.success(res, 200, user, "Đổi mật khẩu thành công");
  } catch (error) {
    console.log(error);
    return response.error(res, 401);
  }
};

const changePassword = async (req, res) => {
  const data = req.body;
  const userId = req.user.id;
  try {
    const result = await authService.changePassword(userId, data);
    return response.success(res, 200, result);
  } catch (error) {
    console.log(error);
    response.error(res, 401, error);
  }
};

const editProfile = async (req, res) => {
  const user = req.user;
  const userId = user.id;
  const data = req.body;

  try {
    const result = await authService.editProfile(userId, data);
    return response.success(res, 200, result);
  } catch (error) {
    console.log(error);
    return response.error(res, 401, error);
  }
};

const userSetting = async (req, res) => {
  const user = req.user;

  try {
    const result = await authService.userSetting(user.id);
    return response.success(res, 200, result);
  } catch (error) {
    console.log(error);
    return response.error(res, 401, error);
  }
};

const settings = async (req, res) => {
  const user = req.user;
  const data = req.body;

  try {
    const result = await authService.settings(user.id, data);
    return response.success(res, 200, result);
  } catch (error) {
    console.log(error);
    return response.error(res, 401, error);
  }
};

const sendCode = async (req, res) => {
  const data = req.body;
  try {
    const auth = await authService.sendCode(data);
    if (auth.otp_code !== "") {
      queue.dispatch("sendCodeJob", auth);
    }
    response.success(res, 200);
  } catch (error) {
    console.log(error);
    response.error(res, 401, "Không xác thực được người dùng này");
  }
};
//
const verifyEmail = async (req, res) => {
  const { token } = req.body;
  if (!token) {
    return response.error(res, 400, "Thiếu mã xác thực");
  }
  try {
    const payload = emailToken.verify(token);
    const user = await usersService.getByKey(payload.sub);
    if (!user) return response.error(res, 401);
    await usersService.update(user.id, { verified_at: new Date() });
    response.success(res, 200, user);
  } catch (error) {
    response.error(res, 401, error);
  }
};

const checkEmail = async (req, res) => {
  const data = req.body;
  try {
    const auth = await authService.checkEmail(data);
    return response.success(res, 200, auth);
  } catch (error) {
    return response.error(res, 409, error);
  }
};

const logout = async (req, res) => {
  const token = readCookie(req, "token");
  const data = await authService.auth(token);
  const newToken = accessToken.create(data, { expiresIn: "1s" });
  const newRefreshToken = refreshToken.create(data, { expiresIn: "1s" });
  createCookie(res, "token", newToken, { maxAge: 1000 });
  createCookie(res, "refresh-token", newRefreshToken, { maxAge: 1000 });
  response.success(res, 200);
};

module.exports = {
  login,
  register,
  logout,
  verifyEmail,
  checkEmail,
  checkUsername,
  editProfile,
  changePassword,
  settings,
  userSetting,
  resetPassword,
  auth,
  sendCode,
  sendForgotEmail,
  refreshTok,
};
