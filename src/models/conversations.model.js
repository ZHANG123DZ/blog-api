module.exports = (sequelize, DataTypes) => {
  const Conversation = sequelize.define(
    "Conversation",
    {
      avatar_url: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      name: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      is_group: {
        type: DataTypes.TINYINT(),
        defaultValue: 0,
      },
      deleted_at: {
        type: DataTypes.DATE(6),
        allowNull: true,
      },
    },
    {
      tableName: "conversations",
      timestamps: true,
      underscored: true,
      charset: "utf8",
      collate: "utf8_general_ci",
      engine: "InnoDB",
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );
  Conversation.associate = (db) => {
    Conversation.belongsToMany(db.User, {
      through: db.UserConversation,
      foreignKey: "conversation_id",
      as: "users",
    });
    Conversation.hasMany(db.UserConversation, {
      foreignKey: "conversation_id",
      as: "participants",
    });
    Conversation.hasMany(db.Message, {
      foreignKey: "conversation_id",
      as: "messages",
    });
    Conversation.hasMany(db.MessageRead, {
      foreignKey: "conversation_id",
      as: "list_readers",
    });
  };
  return Conversation;
};
