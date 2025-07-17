//userStatusRoute.js
const express = require("express");
const router = express.Router();

router.get("/status/:userId", async (req, res) => {
  const { getTotalTokens } = require("../services/usageServiceDB");
  const { isUserOnCooldown } = require("../services/levelManagementService");
  
  const userId = req.params.userId;
  const totalTokens = await getTotalTokens(userId);
  const cooldownStatus = await isUserOnCooldown(userId);
  
  res.json({
    userId,
    totalTokens,
    threshold: process.env.TOKEN_THRESHOLD ,
    currentLevel: cooldownStatus.isOnCooldown ? 2 : (totalTokens >= (process.env.TOKEN_THRESHOLD ) ? 2 : 1),
    cooldown: cooldownStatus
  });
});

module.exports = router; 