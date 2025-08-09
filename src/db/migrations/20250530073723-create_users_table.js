"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
    await queryInterface.createTable(
      "users",
      {
        id: {
          type: Sequelize.BIGINT.UNSIGNED,
          allowNull: false,
          autoIncrement: true,
          primaryKey: true,
        },
        username: {
          type: Sequelize.STRING(100),
          allowNull: false,
          unique: true,
        },
        email: {
          type: Sequelize.STRING(100),
          unique: true,
        },
        phone: {
          type: Sequelize.STRING(20),
          unique: true,
        },
        password: {
          type: Sequelize.STRING(255),
          defaultValue: null,
        },
        full_name: {
          type: Sequelize.STRING(191),
        },
        first_name: {
          type: Sequelize.STRING(100),
        },
        last_name: {
          type: Sequelize.STRING(100),
        },
        avatar_url: {
          type: Sequelize.STRING(191),
        },
        cover_url: {
          type: Sequelize.STRING(255),
        },
        title: {
          type: Sequelize.STRING(255),
        },
        bio: {
          type: Sequelize.TEXT,
        },
        social: {
          type: Sequelize.TEXT,
        },
        post_count: {
          type: Sequelize.BIGINT,
          defaultValue: 0,
        },
        follower_count: {
          type: Sequelize.BIGINT,
          defaultValue: 0,
        },
        following_count: {
          type: Sequelize.BIGINT,
          defaultValue: 0,
        },
        like_count: {
          type: Sequelize.BIGINT,
          defaultValue: 0,
        },
        gender: {
          type: Sequelize.ENUM("male", "female", "other"),
        },
        birthday: {
          type: Sequelize.DATEONLY,
        },
        role: {
          type: Sequelize.STRING(100),
        },
        status: {
          type: Sequelize.ENUM("active", "inactive", "banned"),
          defaultValue: "active",
        },
        location: {
          type: Sequelize.STRING(100),
        },
        website: {
          type: Sequelize.STRING(255),
        },
        two_factor_enabled: {
          type: Sequelize.BOOLEAN,
          defaultValue: 0,
        },
        last_seen: {
          type: Sequelize.DATE(6),
        },
        login_provider: {
          type: Sequelize.STRING(100),
        },
        last_login_at: {
          type: Sequelize.DATE(6),
        },
        email_sent_at: {
          type: Sequelize.DATE(6),
        },
        verified_at: {
          type: Sequelize.DATE(6),
        },
        created_at: {
          type: Sequelize.DATE(6),
          defaultValue: Sequelize.literal("CURRENT_TIMESTAMP(6)"),
        },
        updated_at: {
          type: Sequelize.DATE(6),
          defaultValue: Sequelize.literal("CURRENT_TIMESTAMP(6)"),
          onUpdate: Sequelize.literal("CURRENT_TIMESTAMP"),
        },
        deleted_at: {
          type: Sequelize.DATE(6),
        },
      },
      {
        timestamps: true,
        underscored: true,
        charset: "utf8",
        collate: "utf8_general_ci",
        engine: "InnoDB",
      }
    );
  },

  async down(queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
    await queryInterface.dropTable("users");
  },
};
