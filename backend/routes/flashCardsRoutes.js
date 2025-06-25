const express = require('express');
const router = express.Router();

// Stub: Flashcards routes
router.get('/', (req, res) => {
  res.status(501).json({ error: 'Flashcards not implemented' });
});

module.exports = router;
