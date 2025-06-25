const express = require('express');
const router = express.Router();

// Stub: Game routes (table creation, list, start)
router.get('/', (req, res) => {
  res.status(501).json({ error: 'Game routes not implemented' });
});

module.exports = router;