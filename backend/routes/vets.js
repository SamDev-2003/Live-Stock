// routes/vets.js
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect } = require('../middleware/auth');

router.get('/', protect, async (req, res) => {
  try {
    const vets = await User.find({ role: 'vet', isActive: true }).select('-password').sort({ name: 1 });
    res.json(vets);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
