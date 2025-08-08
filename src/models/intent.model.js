module.exports = (sequelize, DataTypes) => {
  const Intent = sequelize.define(
    "Intent",
    {
      input: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      intent: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      source: {
        type: DataTypes.STRING,
        defaultValue: null,
        allowNull: true,
      },
    },
    {
      tableName: "intents",
      timestamps: true,
      underscored: true,
      charset: "utf8",
      collate: "utf8_general_ci",
      engine: "InnoDB",
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );

  return Intent;
};
