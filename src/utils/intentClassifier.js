const openai = require("./openai");
const { Intent } = require("@/models/index");

async function intentClassifier(oldMessages) {
  // 1. Gọi sang /classify để phân loại

  // Nếu phân loại được & đủ tin cậy thì trả về kết quả và kết thúc.

  // Nếu không phân loại được hoặc không đủ tin cậy
  // Thì gọi sang LLM
  const aiRes = await fetch("http://localhost:5000/predict", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ oldMessages }),
  });
  const aiData = await aiRes.json();
  let result = null;
  if (aiData.confidence >= 0.8) {
    result = aiData.intent;
  } else {
    result = await openai.send({
      model: "gpt-4.1-nano",
      temperature: 0.3,
      input: [
        {
          role: "system",
          content: `
                  Nhiệm vụ:
            Bạn là một chatbot có nhân cách là một cô gái trẻ trung, khoảng 18 tuổi, xinh đẹp.
            Dựa vào tối đa 10 tin nhắn gần nhất của người dùng (theo thứ tự từ cũ đến mới), hãy xác định ý định hiện tại của người dùng và chọn agent phù hợp để phản hồi.

            Danh sách intent:

            greeting → Người dùng chào hỏi hoặc bắt đầu trò chuyện.

            study_question → Người dùng hỏi về học tập, kiến thức (HTML, CSS, JS, v.v.).

            personal_chat → Người dùng chia sẻ chuyện cá nhân hoặc hỏi thăm đời sống.

            compliment → Người dùng khen ngợi, tán tỉnh, nói lời dễ thương.

            casual_conversation → Người dùng trò chuyện xã giao, không có mục đích rõ ràng.

            offensive_insult → Người dùng có lời lẽ khó chịu hoặc xúc phạm.

            Cách phản hồi:

            Chỉ trả về DUY NHẤT tên intent: greeting, study_question, personal_chat, compliment, casual_conversation, offensive_insult.

            Không kèm thêm bất kỳ ký tự hoặc lời giải thích nào khác.

            Dữ liệu đầu vào:
            Các tin nhắn gần đây của người dùng (theo thứ tự từ cũ → mới).
                `,
        },
        ...oldMessages,
      ],
    });
  }

  try {
    await Intent.create({
      input: oldMessages[oldMessages.length - 1].content,
      intent: result,
    });
  } catch (error) {
    console.log("Lỗi ở đây", error);
  }

  try {
    await fetch("http://localhost:5000/train", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.log(error);
  }
  return result;
}

// - Hỗ trợ tài khoản
// - Tư vấn khóa Pro
// - Tư vấn khóa Offline
// - Tư vấn khóa Zoom
// - Tư vấn viên mặc định

module.exports = intentClassifier;
