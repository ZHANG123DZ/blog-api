"use strict";

const { faker } = require("@faker-js/faker/locale/vi");

const intents = [
  "greeting",
  "study_question",
  "personal_chat",
  "compliment",
  "casual_conversation",
  "offensive_insult",
];

const templates = {
  greeting: [
    "Chào cậu nha!",
    "Hello, hôm nay thế nào?",
    "Chào buổi sáng!",
    "Hii, dạo này ổn không?",
    "Xin chào nhé!",
  ],
  study_question: [
    "Cậu giúp tớ giải bài này với?",
    "Tớ không hiểu bài lập trình này.",
    "Bài xác suất này làm thế nào?",
    "Cậu biết công thức tích phân không?",
    "Hôm nay tớ có bài toán khó quá.",
  ],
  personal_chat: [
    "Cậu học trường nào thế?",
    "Cậu có người yêu chưa?",
    "Ở Bách Khoa học có khó không?",
    "Cậu học ngành gì vậy?",
    "Cậu quê ở đâu?",
  ],
  compliment: [
    "Cậu xinh quá!",
    "Cậu dễ thương ghê.",
    "Cậu học giỏi thật.",
    "Phong cách ăn mặc đẹp ghê.",
    "Cậu nói chuyện duyên quá.",
  ],
  casual_conversation: [
    "Hôm nay trời đẹp ghê.",
    "Cậu ăn cơm chưa?",
    "Cuối tuần này làm gì vậy?",
    "Dạo này có xem phim gì không?",
    "Tối nay đi chơi nhé?",
  ],
  offensive_insult: [
    "Dmm",
    "Địt mẹ mày",
    "Con chó khốn nạn",
    "Con súc vật óc chó",
    "Con đĩ ngu lol",
    "Dm con chó này",
    "Thằng óc chó",
    "Đồ mất dạy",
    "Mày ngu như bò",
    "Cái mặt như cái bô",
    "Thằng đầu buồi",
    "Mẹ mày chứ",
    "Cút mẹ mày đi",
    "Ngu như cục đất",
    "Cái đồ não phẳng",
    "Đồ vô dụng",
    "Địt con mẹ nó",
    "Đồ hãm lồn",
    "Cái loại mất dạy",
    "Súc vật đội lốt người",
  ],
};

function randomSentence(intent) {
  const base = faker.helpers.arrayElement(templates[intent]);
  const suffix = faker.helpers.arrayElement([
    "",
    " nha",
    " á",
    " nè",
    " đó",
    " nhé",
  ]);
  return `${base}${suffix}`;
}

module.exports = {
  async up(queryInterface, Sequelize) {
    // 👇 ép kết nối MySQL sang utf8mb4 để lưu tiếng Việt + ký tự đặc biệt
    await queryInterface.sequelize.query("SET NAMES utf8mb4");

    const data = [];

    for (let i = 0; i < 200; i++) {
      const intent = faker.helpers.arrayElement(intents);
      const input = randomSentence(intent);
      data.push({
        input,
        intent,
        created_at: new Date(),
        updated_at: new Date(),
      });
    }

    await queryInterface.bulkInsert("intents", data);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("intents", null, {});
  },
};
