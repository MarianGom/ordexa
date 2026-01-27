const express = require("express");
const router = express.Router();

const authMiddleware = require("../middlewares/authMiddleware");
const dashboardController = require("../controllers/dashboardController");

router.get("/dashboard", authMiddleware, dashboardController.index);

module.exports = router;
