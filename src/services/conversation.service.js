const faker = require("@faker-js/faker");

const {
  Conversation,
  UserConversation,
  User,
  Message,
  MessageRead,
} = require("@/models");
const { Sequelize } = require("@/models");
const { Op } = Sequelize;

class ConversationService {
  // Tạo mới conversation cho 2 người trở lên
  async create(userId, participantsId, conversationData = {}) {
    participantsId.push(userId);
    if (participantsId.length > 2) {
      conversationData.avatar_url = faker.image.avatar();
    }
    const users = await User.findAll({
      where: { id: participantsId },
    });
    if (users.length < 2) throw new Error("User(s) not found");
    if (users.length === 2) {
      conversationData.name = null;
    } else {
      if (!conversationData.name) {
        conversationData.name = `${users[0].full_name} và ${
          users.length - 1
        } người khác`;
      }
      if (!conversationData.avatar_url) {
        conversationData.avatar_url = faker.image.avatar();
      }
    }
    const conversation = await Conversation.create(conversationData);

    await UserConversation.bulkCreate(
      participantsId.map((id) => ({
        user_id: id,
        conversation_id: conversation.id,
      })),
      { ignoreDuplicates: true }
    );
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
      order: [["updated_at", "DESC"]],
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
    return conversations.map((conv) => {
      const data = conv.get({ plain: true });

      if (data.users.length === 2) {
        const speaker = data.users.find((u) => u.id !== userId);
        data.name = speaker.full_name;
        data.avatar_url = speaker.avatar_url;
      }

      data.lastMessage = data.messages?.[0] ?? null;
      delete data.messages;

      data.unreadCount = unreadMap.get(data.id) || 0;

      delete data.list_readers;

      return data;
    });
  }

  async getById(id, userId) {
    const isParticipant = await UserConversation.findOne({
      where: { conversation_id: id, user_id: userId },
    });
    if (!isParticipant) throw new Error("Forbidden");

    const conversation = await Conversation.findByPk(id, {
      include: [
        {
          model: User,
          as: "users",
          attributes: ["id", "full_name", "avatar_url", "username"],
          through: { attributes: [] },
        },
        {
          model: Message,
          as: "messages",
          include: [
            {
              model: User,
              as: "sender",
              attributes: [
                "id",
                "username",
                "full_name",
                "avatar_url",
                "last_seen",
              ],
            },
          ],
        },
      ],
      order: [[{ model: Message, as: "messages" }, "created_at", "DESC"]],
    });

    if (!conversation) throw new Error("Conversation not found");

    const plainConversation = conversation.toJSON();

    if (plainConversation.users.length === 2) {
      plainConversation.avatar_url =
        plainConversation.users.find((user) => user.id !== userId)
          ?.avatar_url || null;
    }

    plainConversation.messages = (plainConversation.messages || []).map(
      (mes) => ({
        ...mes,
        author: mes.user_id === userId ? "me" : "other",
      })
    );

    return plainConversation;
  }

  async update(id, userId, data) {
    const isParticipant = await UserConversation.findOne({
      where: { conversation_id: id, user_id: userId },
    });
    if (!isParticipant) throw new Error("Forbidden");

    await Conversation.update(data, { where: { id } });
    return await this.getById(id, userId);
  }

  async remove(id, userId) {
    const isParticipant = await UserConversation.findOne({
      where: { conversation_id: id, user_id: userId },
    });
    if (!isParticipant) throw new Error("Forbidden");

    await Conversation.update({ deleted_at: new Date() }, { where: { id } });
    return true;
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

    return await this.create(userId, [targetUserId]);
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
