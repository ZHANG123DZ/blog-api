module.exports = (sequelize, DataTypes) => {
  const Badge = sequelize.define(
    "Badge",
    {
      name: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      color: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      icon: {
        type: DataTypes.STRING,
        allowNull: false,
      },
    },
    {
      tableName: "badges",
      timestamps: true,
      underscored: true,
      charset: "utf8mb4",
      collate: "utf8mb4_unicode_ci",
      engine: "InnoDB",
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );
  Badge.associate = (db) => {
    Badge.belongsToMany(db.User, {
      through: db.UserBadge,
      foreignKey: "badge_id",
      as: "users",
    });
    Badge.hasMany(db.UserBadge, {
      foreignKey: "badge_id",
      as: "userBadges",
    });
  };
  return Badge;
};
