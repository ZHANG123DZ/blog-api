const { Sequelize } = require("@/models");

const {
  Conversation,
  UserConversation,
  User,
  Message,
  MessageRead,
} = require("@/models");
const pusher = require("@/configs/pusher");
const { Op } = Sequelize;

class ConversationService {
  formatConversation(conv, userId, unreadMap = new Map()) {
    const data = conv.get ? conv.get({ plain: true }) : conv; // Nếu là instance Sequelize thì .get()

    if (!data.is_group) {
      const speaker = data.users.find((u) => u.id !== userId);
      data.name = speaker?.full_name;
      data.avatar_url = speaker?.avatar_url;
    } else if (!data.name) {
      data.name = data.users
        .slice(0, 4)
        .map((user) => user.full_name)
        .join(", ");
    }

    data.lastMessage = data.messages?.[0] ?? null;
    delete data.messages;

    data.unreadCount = unreadMap.get(data.id) || 0;

    delete data.list_readers;

    return data;
  }

  async broadcastConversation(conversationId, event = "update-conversation") {
    const participants = await UserConversation.findAll({
      where: { conversation_id: conversationId },
      attributes: ["user_id"],
      raw: true,
    });

    for (const { user_id } of participants) {
      const formattedData = await this.getById(user_id, conversationId);
      pusher.trigger(`conversation-of-${user_id}`, event, formattedData);
    }
  }

  async create(userId, participantsId, conversationData = {}) {
    participantsId.push(userId);

    const users = await User.findAll({ where: { id: participantsId } });
    if (users.length < 2) throw new Error("User(s) not found");

    conversationData.is_group = users.length > 2;
    if (!conversationData.is_group) conversationData.name = null;

    const conversation = await Conversation.create(conversationData);

    await UserConversation.bulkCreate(
      participantsId.map((id) => ({
        user_id: id,
        conversation_id: conversation.id,
      })),
      { ignoreDuplicates: true }
    );
    // Pusher data đã format
    await this.broadcastConversation(conversation.id, "new-conversation");
    return conversation;
  }

  async getAllByUser(userId) {
    const conversations = await Conversation.findAll({
      include: [
        {
          model: UserConversation,
          as: "participants",
          where: { user_id: userId },
          attributes: [],
        },
        {
          model: User,
          as: "users",
          attributes: [
            "id",
            "full_name",
            "avatar_url",
            "username",
            "role",
            "last_seen",
            [
              Sequelize.cast(
                Sequelize.literal(`
              TIMESTAMPDIFF(SECOND, users.last_seen, NOW()) <= 60
            `),
                "boolean"
              ),
              "isOnline",
            ],
          ],
          through: { attributes: [] },
        },
        {
          model: Message,
          as: "messages",
          separate: true,
          limit: 1,
          order: [["created_at", "DESC"]],
        },
        {
          model: MessageRead,
          as: "list_readers",
          where: { user_id: userId },
          required: false,
        },
      ],
      order: [
        [
          Sequelize.literal(`
      COALESCE(
        (SELECT MAX(created_at) FROM messages WHERE messages.conversation_id = Conversation.id),
        Conversation.created_at
      )
    `),
          "DESC",
        ],
      ],
    });

    const convIds = conversations.map((c) => c.id);

    // 1. Lấy message_id cuối đã đọc
    const reads = await MessageRead.findAll({
      where: { user_id: userId },
      attributes: ["conversation_id", "message_id"],
      raw: true,
    });

    const lastReadMap = new Map(
      reads.map((r) => [r.conversation_id, r.message_id])
    );

    const { Op } = Sequelize;

    // 2. Đếm tin chưa đọc
    const unreadCountsArr = await Promise.all(
      convIds.map(async (convId) => {
        const lastReadId = lastReadMap.get(convId) || 0;

        const count = await Message.count({
          where: {
            conversation_id: convId,
            user_id: { [Op.ne]: userId },
            id: { [Op.gt]: lastReadId },
          },
        });

        return { conversation_id: convId, unread_count: count };
      })
    );

    const unreadMap = new Map(
      unreadCountsArr.map((u) => [u.conversation_id, u.unread_count])
    );

    // 3. Build kết quả
    return conversations.map((conv) =>
      this.formatConversation(conv, userId, unreadMap)
    );
  }

  async getById(userId, conversationId) {
    const isParticipant = await UserConversation.findOne({
      where: { conversation_id: conversationId, user_id: userId },
    });
    if (!isParticipant) throw new Error("Forbidden");

    const conversation = await Conversation.findOne({
      where: { id: conversationId },
      include: [
        {
          model: User,
          as: "users",
          attributes: [
            "id",
            "full_name",
            "avatar_url",
            "username",
            "role",
            "last_seen",
            [
              Sequelize.cast(
                Sequelize.literal(`
                  TIMESTAMPDIFF(SECOND, users.last_seen, NOW()) <= 60
                `),
                "boolean"
              ),
              "isOnline",
            ],
          ],
          through: { attributes: [] },
        },
        {
          model: Message,
          as: "messages",
          separate: true,
          limit: 1,
          order: [["created_at", "DESC"]],
        },
        {
          model: MessageRead,
          as: "list_readers",
          where: { user_id: userId },
          required: false,
        },
      ],
    });

    if (!conversation) throw new Error("Conversation not found");

    // Lấy unread count cho đúng 1 conv
    const lastRead = await MessageRead.findOne({
      where: { user_id: userId, conversation_id: conversationId },
    });

    const lastReadId = lastRead?.message_id || 0;
    const unreadCount = await Message.count({
      where: {
        conversation_id: conversationId,
        user_id: { [Op.ne]: userId },
        id: { [Op.gt]: lastReadId },
      },
    });

    return this.formatConversation(
      conversation,
      userId,
      new Map([[conversationId, unreadCount]])
    );
  }

  async update(id, userId, data) {
    const isParticipant = await UserConversation.findOne({
      where: { conversation_id: id, user_id: userId },
    });

    if (!isParticipant) throw new Error("Forbidden");

    await Conversation.update(data, { where: { id } });

    await this.broadcastConversation(id, "update-conversation");

    return;
  }

  async remove(id, userId) {
    const isParticipant = await UserConversation.findOne({
      where: { conversation_id: id, user_id: userId },
    });
    if (!isParticipant) throw new Error("Forbidden");

    await Conversation.update({ deleted_at: new Date() }, { where: { id } });

    await this.broadcastConversation(id, "delete-conversation");
    return true;
  }

  async joinGroup(participantsId, id) {
    const participantsArray = participantsId.map((userId) => ({
      user_id: userId,
      conversation_id: id,
    }));

    await UserConversation.bulkCreate(participantsArray);
    await this.broadcastConversation(id, "update-conversation");
    return;
  }

  async leaveGroup(userId, id) {
    await UserConversation.destroy({
      where: { user_id: userId, conversation_id: id },
    });
    await this.broadcastConversation(id, "update-conversation");
    return;
  }

  async getOrCreate(userId, targetUserId) {
    const conversations = await Conversation.findAll({
      include: [
        {
          model: UserConversation,
          as: "participants",
          where: {
            user_id: { [Op.in]: [userId, targetUserId] },
          },
          attributes: ["user_id"],
        },
      ],
    });

    for (const convo of conversations) {
      const userIds = convo.participants.map((p) => p.user_id);
      const isSamePair =
        userIds.includes(userId) &&
        userIds.includes(targetUserId) &&
        userIds.length === 2;

      if (isSamePair) return convo;
    }
    const newConversations = await this.create(userId, [targetUserId]);
    pusher.trigger(
      `conversation-of-${userId}`,
      "new-conversation",
      newConversations
    );
    return newConversations;
  }

  async markedRead(userId, conversationId, messageId = null, readAt = null) {
    const [record, created] = await MessageRead.findOrCreate({
      where: { user_id: userId, conversation_id: conversationId },
      defaults: {
        message_id: messageId,
        read_at: readAt,
      },
    });

    if (!created) {
      if (record.message_id === null || record.message_id < messageId) {
        await record.update({
          message_id: messageId,
          read_at: readAt,
        });
      }
    }
  }
}

module.exports = new ConversationService();
