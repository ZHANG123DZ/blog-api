const ConversationService = require("@/services/conversation.service");

const response = require("@/utils/response");
const throwError = require("@/utils/throwError");

exports.create = async (req, res) => {
  const { id: currentUserId } = req.user;
  const { participantsId } = req.body;
  const conversation = await ConversationService.create(
    currentUserId,
    participantsId,
    req.body
  );
  response.success(res, 201, conversation);
};

exports.getAllByUser = async (req, res) => {
  const { id: currentUserId } = req.user;
  const conversations = await ConversationService.getAllByUser(currentUserId);
  response.success(res, 200, conversations);
};

exports.getById = async (req, res) => {
  const { id: currentUserId } = req.user;
  const { id } = req.params;
  const conversation = await ConversationService.getById(id, currentUserId);
  response.success(res, 200, conversation);
};

exports.update = async (req, res) => {
  const { id: currentUserId } = req.user;
  const { id } = req.params;
  const updated = await ConversationService.update(id, currentUserId, req.body);
  response.success(res, 200, updated);
};

exports.remove = async (req, res) => {
  const { id: currentUserId } = req.user;
  const { id } = req.params;
  await ConversationService.remove(id, currentUserId);
  response.success(res, 200, { message: "Conversation deleted" });
};

exports.getOrCreate = async (req, res) => {
  const { participant_id } = req.body;
  const userId = req.user.id;

  const conversation = await ConversationService.getOrCreate(
    userId,
    participant_id
  );
  response.success(res, 200, conversation);
};

exports.markedRead = async (req, res) => {
  const { messageId, readAt } = req.body;
  const userId = req.user.id;
  const conversationId = req.params.id;
  const conversation = await ConversationService.markedRead(
    userId,
    conversationId,
    messageId,
    readAt
  );
  response.success(res, 200, conversation);
};

exports.joinGroup = async (req, res) => {
  const { participantsId } = req.body;
  const conversationId = req.params.id;
  const conversation = await ConversationService.joinGroup(
    participantsId,
    conversationId
  );
  response.success(res, 200, conversation);
};
exports.leaveGroup = async (req, res) => {
  const userId = req.user.id;
  const conversationId = req.params.id;
  const conversation = await ConversationService.leaveGroup(
    userId,
    conversationId
  );
  response.success(res, 200, conversation);
};
