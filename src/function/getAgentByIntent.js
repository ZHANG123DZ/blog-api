const defaultAgent = require("@/agent/defaultAgent");
const friendlyAgent = require("@/agent/friendlyAgent");
const personalFriendAgent = require("@/agent/personalFriendAgent");
const studyHelperAgent = require("@/agent/studyHelperAgent");
const sweetAgent = require("@/agent/sweetAgent");

function getAgentByIntent(intent) {
  const mapping = {
    greeting: friendlyAgent.systemPrompt,
    study_question: studyHelperAgent.systemPrompt,
    personal_chat: personalFriendAgent.systemPrompt,
    compliment: sweetAgent.systemPrompt,
    casual_conversation: defaultAgent.systemPrompt,
    offensive_insult: friendlyAgent.systemPrompt,
  };

  return mapping[intent] || "defaultAgent";
}

module.exports = getAgentByIntent;
