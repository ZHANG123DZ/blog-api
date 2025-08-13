"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const [posts] = await queryInterface.sequelize.query(
      `SELECT id FROM posts`
    );
    const [tags] = await queryInterface.sequelize.query(`SELECT id FROM tags`);

    const postTags = [];

    for (const post of posts) {
      // Mỗi post được gán từ 1 đến 5 tag ngẫu nhiên
      const randomTags = tags
        .sort(() => 0.5 - Math.random())
        .slice(0, Math.floor(Math.random() * 5) + 1);

      for (const tag of randomTags) {
        postTags.push({
          post_id: post.id,
          tag_id: tag.id,
          created_at: new Date(),
          updated_at: new Date(),
        });
      }
    }

    await queryInterface.bulkInsert("post_tags", postTags);
    await queryInterface.sequelize.query(`
      UPDATE tags
      SET post_count = (
        SELECT COUNT(*) FROM post_tags WHERE tag_id = tags.id
      )
    `);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("post_tags", null, {});
    return queryInterface.sequelize.query(`
      UPDATE tags SET post_count = 0
    `);
  },
};
