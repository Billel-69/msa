//chatRoutes.js
const express = require("express");
const router = express.Router();
const openaiCtrl = require("../controllers/openaiController");
const { enhancedTokenMeter } = require("../services/levelManagementService");

router.post("/", enhancedTokenMeter, openaiCtrl.processMessage);

module.exports = router;