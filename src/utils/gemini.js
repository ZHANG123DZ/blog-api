import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.GEMINI_API_KEY,
  baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
});

async function send({
  messages,
  temperature = 0.7,
  model = "gemini-2.0-flash",
}) {
  const response = await openai.chat.completions.create({
    model,
    messages,
    temperature,
  });

  return response.choices?.[0]?.message.content || null;
}

export { send };
