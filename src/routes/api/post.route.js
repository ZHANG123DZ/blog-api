const express = require("express");
const postsController = require("@/controllers/post.controller");
const auth = require("@/middlewares/auth");
const getCurrentUser = require("@/middlewares/getCurrentUser");

const router = express.Router();

router.get("/", getCurrentUser, postsController.index);
router.get("/latest", getCurrentUser, postsController.latest);
router.get("/featured", getCurrentUser, postsController.featured);
router.post("/related", getCurrentUser, postsController.related);
router.get("/:key", postsController.show);
router.post("/", auth, postsController.store);
router.put("/:key", auth, postsController.update);
router.get("/edit/:slug", auth, postsController.getUserPostForEdit);
router.patch("/:key", auth, postsController.update);
router.delete("/:key", auth, postsController.destroy);

module.exports = router;
