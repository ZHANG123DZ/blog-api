const bcrypt = require("bcrypt");
const otpGenerator = require("otp-generator");
const {
  RefreshToken,
  User,
  Email,
  Skill,
  Badge,
  UserSetting,
} = require("@/models/index");
const accessToken = require("@/utils/accessToken");
const { Op } = require("sequelize");
const generateUsernameFromEmail = require("@/utils/generateUsernameFromEmail");
const refreshToken = require("@/utils/refreshToken");

class authService {
  async auth(token) {
    const auth = accessToken.verify(token);
    if (!auth) return null;
    const user = await User.findOne({
      where: { id: auth.sub },
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
        "email",
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
        "two_factor_enabled",
        "verified_at",
      ],
    });
    return user;
  }
  async refreshTok(token) {
    const auth = refreshToken.verify(token);
    if (!auth) return null;
    const user = await User.findOne({
      where: { id: auth.sub },
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
        "email",
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
        "two_factor_enabled",
        "verified_at",
      ],
    });
    return user;
  }

  async login(data) {
    const auth = await User.findOne({ where: { email: data?.email } });
    if (!auth) {
      throw new Error("Dang nhap that bai");
    }

    const isMatch = await bcrypt.compare(data.password, auth.password);
    if (!isMatch) {
      throw new Error("Dang nhap that bai");
    }
    delete auth.password;
    return auth.dataValues;
  }

  async register(data) {
    const saltRounds = 10;
    data.password = await bcrypt.hash(data.password, saltRounds);
    if (!data.username) {
      const username = await generateUsernameFromEmail(data);
      data.username = username;
    }
    if (!data.full_name) {
      const full_name = `${data.first_name} ${data.last_name}`;
      data.full_name = full_name;
    }
    const auth = await User.create(data);
    await UserSetting.create({ user_id: auth.dataValues.id });

    return auth.dataValues;
  }

  async editProfile(userId, data) {
    const user = await User.update(data, { where: { id: userId } });
    return user.dataValues;
  }

  async userSetting(id) {
    const userSetting = await UserSetting.findOne({ where: { user_id: id } });
    return userSetting.dataValues;
  }

  async settings(id, data) {
    const user = await UserSetting.update(data, { where: { user_id: id } });
    return user.dataValues;
  }

  async sendForgotEmail(email) {
    const user = await User.findOne({ where: { email } });
    return user.dataValues;
  }

  async resetPassword(id, password) {
    const saltRounds = 10;
    const newPassword = await bcrypt.hash(password, saltRounds);
    const user = await User.update(
      { password: newPassword },
      { where: { id } }
    );
    return user.dataValues;
  }

  async changePassword(userId, data) {
    const { currentPassword, newPassword } = data;

    const curUser = await User.findOne({ where: { id: userId } });
    if (!curUser) {
      throw new Error("User không tồn tại");
    }

    const isMatch = await bcrypt.compare(currentPassword, curUser.password);
    if (!isMatch) {
      throw new Error("Mật khẩu hiện tại không chính xác");
    }

    const saltRounds = 10;
    const newHashedPass = await bcrypt.hash(newPassword, saltRounds);

    await User.update({ password: newHashedPass }, { where: { id: userId } });

    return { success: true, message: "Đổi mật khẩu thành công" };
  }

  async sendCode(data) {
    //Tạo mã OTP
    const otp = otpGenerator.generate(6, {
      digits: true,
      upperCaseAlphabets: false,
      lowerCaseAlphabets: false,
      specialChars: false,
    });
    data.body = JSON.stringify({ otp_code: otp });
    data.expired_at = new Date(Date.now() + 1000 * 60);
    data.type = "verification";
    const code = await Email.create(data);
    return code.dataValues;
  }

  async verifyEmail(data) {
    const auth = await Email.findOne({
      where: {
        email: data.email,
        otp_code: data.code,
        type: "verification",
        expired_at: {
          [Op.gt]: new Date(),
        },
        verified_at: null,
      },
      order: [["created_at", "DESC"]],
    });

    if (!auth) {
      throw new Error("Mã xác thực không tồn tại, sai mã hoặc đã hết hạn.");
    }

    await auth.update({ verified_at: new Date() });

    return auth.dataValues;
  }

  async checkEmail(data) {
    const exits = await User.findOne({
      where: { email: data.email },
    });
    if (!exits) {
      return false;
    }
    return true;
  }

  async checkUsername(data) {
    const auth = await User.findOne({
      where: { username: data.username },
    });
    if (!auth) {
      return null;
    }
    return auth.dataValues;
  }

  async logout(id) {
    return post;
  }
}

module.exports = new authService();
