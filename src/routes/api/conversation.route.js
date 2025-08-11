const express = require("express");
const conversationsController = require("@/controllers/conversation.controller");

const router = express.Router({ mergeParams: true });

router.post("/", conversationsController.create);
router.get("/", conversationsController.getAllByUser);
router.get("/:id", conversationsController.getById);
router.post("/:id/join", conversationsController.joinGroup);
router.delete("/:id/leave", conversationsController.leaveGroup);
router.put("/:id", conversationsController.update);
router.delete("/:id", conversationsController.remove);
router.post("/get-or-create", conversationsController.getOrCreate);
router.patch("/:id/marked-read", conversationsController.markedRead);

module.exports = router;
