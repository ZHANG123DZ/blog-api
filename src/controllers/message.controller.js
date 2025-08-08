const messageService = require("@/services/message.service");
const response = require("@/utils/response");
const throwError = require("@/utils/throwError");

const index = async (req, res) => {
  try {
    const conversationId = req.params.conversation;
    const currentUserId = req.user?.id;
    const { page, limit } = req;

    const messages = await messageService.getMessages(
      conversationId,
      currentUserId
    );

    return response.success(res, 200, messages);
  } catch (error) {
    return response.error(res, 500, error.message || "Failed to get messages");
  }
};

const show = async (req, res) => {
  try {
    const message = await messageService.getById(req.params.id);
    if (!message) return throwError(404, "Message not found");

    return response.success(res, 200, message);
  } catch (error) {
    return response.error(res, 500, error.message || "Failed to get message");
  }
};

const store = async (req, res) => {
  const currentUserId = req.user.id;
  const { conversation_id, content } = req.body;

  if (!conversation_id || !content) {
    throwError(400, "Missing conversation_id or content");
  }

  const message = await messageService.create(
    conversation_id,
    currentUserId,
    content
  );
  response.success(res, 201, message);
};

const update = async (req, res) => {
  try {
    const userId = req.user.id;
    const message = await messageService.update(
      req.params.id,
      userId,
      req.body
    );

    if (!message) return throwError(404, "Message not found");

    return response.success(res, 200, message);
  } catch (error) {
    return response.error(
      res,
      500,
      error.message || "Failed to update message"
    );
  }
};

const destroy = async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await messageService.remove(req.params.id, userId);

    if (!result) return throwError(404, "Message not found");

    return response.success(res, 204);
  } catch (error) {
    return response.error(
      res,
      500,
      error.message || "Failed to delete message"
    );
  }
};

const chatAI = async (req, res) => {
  const conversationId = req.params.conversation;
  const { input, botId } = req.body;

  if (!conversationId || !input) {
    throwError(400, "Missing conversation_id or content");
  }

  const message = await messageService.chatAI(conversationId, botId, input);
  response.success(res, 201, message);
};

module.exports = {
  index,
  show,
  store,
  update,
  destroy,
  chatAI,
};
