const express = require('express');
const router = express.Router();

// Stub: Progress routes not implemented
router.get('/:userId', (req, res) => {
  res.status(501).json({ error: 'Get progress not implemented' });
});

router.post('/:userId', (req, res) => {
  res.status(501).json({ error: 'Update progress not implemented' });
});

module.exports = router;