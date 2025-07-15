"use strict";

const { faker } = require("@faker-js/faker");

/** @type {import('sequelize-cli').Migration} */

module.exports = {
  async up(queryInterface, Sequelize) {
    const users = [];

    for (let i = 0; i < 100; i++) {
      const firstName = faker.person.firstName();
      const lastName = faker.person.lastName();
      const fullName = `${firstName} ${lastName}`;
      const username = faker.internet
        .userName({ firstName, lastName })
        .toLowerCase();
      const email = faker.internet.email({ firstName, lastName }).toLowerCase();
      const social = {
        twitter: `https://twitter.com/${username}`,
        github: `https://github.com/${username}`,
        linkedin: `https://linkedin.com/in/${username}`,
        website: faker.internet.url(),
      };

      const badges = [
        { name: "Top Author", color: "primary", icon: "🏆" },
        { name: "Early Adopter", color: "secondary", icon: "🚀" },
        { name: "Community Helper", color: "success", icon: "🤝" },
      ];
      const randomBadges = faker.helpers.arrayElements(
        badges,
        faker.number.int({ min: 0, max: 3 })
      );

      users.push({
        username,
        email,
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
        posts_count: faker.number.int({ min: 0, max: 100 }),
        followers_count: faker.number.int({ min: 0, max: 5000 }),
        following_count: faker.number.int({ min: 0, max: 500 }),
        likes_count: faker.number.int({ min: 0, max: 10000 }),
        skills: JSON.stringify(
          faker.helpers.arrayElements(
            [
              "React",
              "Vue",
              "Angular",
              "TypeScript",
              "Node.js",
              "GraphQL",
              "Docker",
              "Kubernetes",
              "AWS",
              "SQL",
              "NoSQL",
            ],
            faker.number.int({ min: 2, max: 6 })
          )
        ),
        badges: JSON.stringify(randomBadges),
        role: "user",
        status: "active",
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
