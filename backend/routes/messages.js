const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const Message = require('../models/Message');

// get last N messages (room chat)
router.get('/', auth, async (req, res) => {
  try {
    const messages = await Message.find().sort({ createdAt: 1 }).limit(200).populate('from', 'name email');
    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
