const usersService = require("@/services/user.service");

const response = require("@/utils/response");
const throwError = require("@/utils/throwError");

const index = async (req, res) => {
  const { page, limit } = req;
  const { items, total } = await usersService.getAll(page, limit);
  res.paginate({ items, total });
};

const show = async (req, res) => {
  const username = req.params.key;
  try {
    const user = await usersService.getByKey(username);
    response.success(res, 200, user);
  } catch (error) {
    console.log(error);
    response.error(res, 404, "Không tìm thấy người dùng này");
  }
};

const getUserPosts = async (req, res) => {
  const username = req.params.key;
  const { page, limit } = req;
  const userId = req.user?.id;

  const { items, total } = await usersService.getUserPosts(
    username,
    page,
    limit,
    userId
  );
  res.paginate({ items, total });
};

const store = async (req, res) => {
  const user = await usersService.create(req.body);
  response.success(res, 201, user);
};

const update = async (req, res) => {
  const user = await usersService.update(req.params.key, req.body);

  if (!user) throwError(404, "Not Found.");

  response.success(res, 201, user);
};

const destroy = async (req, res) => {
  const result = await usersService.remove(req.params.key);

  if (!result) throwError(404, "Not Found.");

  response.success(res, 204);
};

async function updateOnline(req, res) {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ error: "Missing userId" });

    const result = await usersService.setUserOnline(userId);
    return res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
}

async function updateOffline(req, res) {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ error: "Missing userId" });

    const result = await usersService.setUserOffline(userId);
    return res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
}

async function getStatus(req, res) {
  try {
    const username = req.params.username;
    const status = await usersService.getUserStatus(username);
    if (!status) return res.status(404).json({ error: "User not found" });
    return res.json(status);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
}

module.exports = {
  show,
  index,
  store,
  update,
  destroy,
  getUserPosts,
  updateOnline,
  updateOffline,
  getStatus,
};
