const topicService = require("@/services/topic.service");

const response = require("@/utils/response");
const throwError = require("@/utils/throwError");

const index = async (req, res) => {
  const { page, limit } = req;
  const { items, total } = await topicService.getAll(page, limit);
  res.paginate({ items, total });
};

const show = async (req, res) => {
  const slug = req.params.slug;
  const userId = req.user?.id;

  const topic = await topicService.getById(slug, userId);

  if (!topic) throwError(404, "Not Found.");

  response.success(res, 200, topic);
};

const store = async (req, res) => {
  const topic = await topicService.create(req.body);
  response.success(res, 201, topic);
};

const update = async (req, res) => {
  const slug = req.params.slug;
  const topic = await topicService.update(slug, req.body);

  if (!topic) throwError(404, "Not Found.");

  response.success(res, 201, topic);
};

const destroy = async (req, res) => {
  const slug = req.params.slug;
  const result = await topicService.remove(slug);

  if (!result) throwError(404, "Not Found.");

  response.success(res, 204);
};

module.exports = { show, index, store, update, destroy };
