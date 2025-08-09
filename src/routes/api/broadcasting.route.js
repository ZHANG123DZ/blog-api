const express = require("express");
const broadcastingController = require("@/controllers/broadcasting.controller");
const getCurrentUser = require("@/middlewares/getCurrentUser");

const router = express.Router({ mergeParams: true });

router.post("/auth", getCurrentUser, broadcastingController.index);

module.exports = router;
