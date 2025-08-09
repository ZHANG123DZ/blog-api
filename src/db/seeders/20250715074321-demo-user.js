"use strict";

const { faker } = require("@faker-js/faker");
const bcrypt = require("bcrypt");

/** @type {import('sequelize-cli').Migration} */

module.exports = {
  async up(queryInterface, Sequelize) {
    const users = [];

    for (let i = 0; i < 100; i++) {
      const firstName = faker.person.firstName();
      const lastName = faker.person.lastName();
      const fullName = `${firstName} ${lastName}`;
      const username = faker.internet
        .username({ firstName, lastName })
        .toLowerCase();
      const email = faker.internet.email({ firstName, lastName }).toLowerCase();
      const social = {
        twitter: `https://twitter.com/${username}`,
        github: `https://github.com/${username}`,
        linkedin: `https://linkedin.com/in/${username}`,
        website: faker.internet.url(),
      };

      const saltRounds = 10;
      const password = "A123@abc";
      const passwordHash = await bcrypt.hash(password, saltRounds);

      users.push({
        username,
        email,
        password: passwordHash,
        full_name: fullName,
        first_name: firstName,
        last_name: lastName,
        avatar_url: faker.image.avatar(),
        cover_url: faker.image.urlPicsumPhotos({ width: 1200, height: 300 }),
        title: faker.person.jobTitle(),
        bio: faker.lorem.sentences(2),
        location: `${faker.location.city()}, ${faker.location.state()}`,
        website: social.website,
        social: JSON.stringify(social),
        post_count: 0,
        follower_count: 0,
        following_count: 0,
        like_count: 0,
        role: "user",
        status: "active",
        last_seen: new Date(),
        two_factor_enabled: false,
        created_at: new Date(),
        updated_at: new Date(),
      });
    }

    await queryInterface.bulkInsert("users", users);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("users", null, {});
  },
};
