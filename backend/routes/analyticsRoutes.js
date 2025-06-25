const express = require('express');
const router = express.Router();

// Stub: Analytics not yet implemented
router.get('/', (req, res) => {
    res.status(501).json({ error: 'Analytics endpoint not implemented' });
});

module.exports = router;