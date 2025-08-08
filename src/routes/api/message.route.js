const express = require("express");
const messagesController = require("@/controllers/message.controller");
const auth = require("@/middlewares/auth");

const router = express.Router({ mergeParams: true });

router.get("/", auth, messagesController.index);
router.post("/chat-bot", messagesController.chatAI);
router.get("/:id", auth, messagesController.show);
router.post("/", auth, messagesController.store);
router.put("/:id", auth, messagesController.update);
router.patch("/:id", auth, messagesController.update);
router.delete("/:id", auth, messagesController.destroy);

module.exports = router;
