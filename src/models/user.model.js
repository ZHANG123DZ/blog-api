module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define(
    "User",
    {
      username: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true,
      },
      email: {
        type: DataTypes.STRING(100),
        allowNull: true,
        unique: true,
      },
      phone: {
        type: DataTypes.STRING(20),
        allowNull: true,
        unique: true,
      },
      password: {
        type: DataTypes.STRING(255),
        allowNull: true,
        defaultValue: null,
      },
      full_name: {
        type: DataTypes.STRING(191),
        allowNull: true,
      },
      first_name: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      last_name: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      avatar_url: {
        type: DataTypes.STRING(191),
        allowNull: true,
      },
      cover_url: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      title: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      bio: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      social: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      post_count: {
        type: DataTypes.BIGINT,
        defaultValue: 0,
        allowNull: true,
      },
      follower_count: {
        type: DataTypes.BIGINT,
        defaultValue: 0,
        allowNull: true,
      },
      following_count: {
        type: DataTypes.BIGINT,
        defaultValue: 0,
        allowNull: true,
      },
      like_count: {
        type: DataTypes.BIGINT,
        defaultValue: 0,
        allowNull: true,
      },
      gender: {
        type: DataTypes.ENUM("male", "female", "other"),
        allowNull: true,
      },
      birthday: {
        type: DataTypes.DATEONLY,
        allowNull: true,
      },
      role: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      status: {
        type: DataTypes.ENUM("active", "inactive", "banned"),
        allowNull: true,
        defaultValue: "active",
      },
      location: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      website: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      two_factor_enabled: {
        type: DataTypes.BOOLEAN,
        defaultValue: 0,
      },
      login_provider: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      last_login_at: {
        type: DataTypes.DATE(6),
        allowNull: true,
      },
      email_sent_at: {
        type: DataTypes.DATE(6),
        allowNull: true,
      },
      verified_at: {
        type: DataTypes.DATE(6),
        allowNull: true,
      },
      deleted_at: {
        type: DataTypes.DATE(6),
        allowNull: true,
      },
    },
    {
      tableName: "users",
      underscored: true,
      charset: "utf8",
      collate: "utf8_general_ci",
      engine: "InnoDB",
      timestamps: false,
    }
  );
  User.associate = (db) => {
    User.hasOne(db.UserSetting, {
      foreignKey: "user_id",
      as: "setting",
    });
    User.hasMany(db.Email, {
      foreignKey: "user_id",
      as: "emails",
    });
    User.hasMany(db.Comment, {
      foreignKey: "user_id",
      as: "comments",
    });
    User.hasMany(db.Follow, {
      foreignKey: "user_id",
      as: "follows",
    });
    User.hasMany(db.Like, {
      foreignKey: "user_id",
      as: "likes",
    });
    User.hasMany(db.BookMark, {
      foreignKey: "user_id",
      as: "bookmarks",
    });
    User.hasMany(db.MessageRead, {
      foreignKey: "user_id",
      as: "reads",
    });
    User.hasMany(db.Notification, {
      foreignKey: "user_id",
      as: "notifications",
    });
    User.hasMany(db.Post, {
      foreignKey: "author_id",
      as: "posts",
    });
    User.hasMany(db.Message, {
      foreignKey: "user_id",
      as: "messages",
    });
    User.belongsToMany(db.Conversation, {
      through: db.UserConversation,
      foreignKey: "user_id",
      otherKey: "conversation_id",
      as: "conversations",
    });
    User.hasMany(db.UserConversation, {
      foreignKey: "user_id",
      as: "conversationsMap",
    });
    User.hasMany(db.UserSkill, {
      foreignKey: "user_id",
      as: "skillMappings",
    });
    User.hasMany(db.UserBadge, {
      foreignKey: "user_id",
      as: "badgeMappings",
    });
    User.belongsToMany(db.Skill, {
      through: db.UserSkill,
      foreignKey: "user_id",
      otherKey: "skill_id",
      as: "skillList",
    });

    User.belongsToMany(db.Badge, {
      through: db.UserBadge,
      foreignKey: "user_id",
      otherKey: "badge_id",
      as: "badgeList",
    });
  };
  return User;
};
