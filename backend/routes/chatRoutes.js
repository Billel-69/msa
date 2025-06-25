//chatRoutes.js
const express = require("express");
const router = express.Router();
const openaiCtrl = require("../controllers/openaiController");

router.post("/", openaiCtrl.processMessage);

module.exports = router;