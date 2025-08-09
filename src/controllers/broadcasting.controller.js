const pusher = require("@/configs/pusher");
const response = require("@/utils/response");

const index = async (req, res) => {
  const socketId = req.body.socket_id;
  const channel = req.body.channel_name;
  const user = req.user;

  if (!user) {
    response.error(res, 403, "Chưa xác thực");
  }

  if (channel.startsWith("presence-")) {
    const auth = pusher.authorizeChannel(socketId, channel, {
      user_id: user.id,
      user_info: {
        username: user.username,
        name: user.full_name,
        avatar: user.avatar_url,
        last_seen: user.last_seen,
        status: "online",
      },
    });
    return response.success(res, 200, auth);
  }
  response.error(res, 403, "Chưa xác thực");
};

module.exports = {
  index,
};
