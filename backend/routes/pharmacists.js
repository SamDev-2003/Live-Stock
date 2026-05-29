// routes/pharmacists.js
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect } = require('../middleware/auth');

router.get('/', protect, async (req, res) => {
  try {
    const pharmacists = await User.find({ role: 'pharmacist', isActive: true }).select('-password').sort({ name: 1 });
    res.json(pharmacists);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
