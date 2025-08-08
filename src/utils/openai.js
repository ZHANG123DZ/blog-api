const OpenAI = require("openai");

const openai = new OpenAI({
  apiKey: process.env.API_KEY_OPENAI,
});

async function send({ input, temperature = 0.7, model = "gpt-4o-mini" }) {
  const response = openai.responses.create({
    model,
    input,
    temperature,
  });

  const result = await response;
  return result.output_text;
}

module.exports = { send };
