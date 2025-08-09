const express = require("express");
const userController = require("@/controllers/user.controller");
const auth = require("@/middlewares/auth");

const router = express.Router();

router.get("/", userController.index);
router.get("/:key", userController.show);
router.get("/:key/posts", userController.getUserPosts);

router.post("/online", userController.updateOnline);
router.post("/offline", userController.updateOffline);
router.get("/status/:username", userController.getStatus);

module.exports = router;
