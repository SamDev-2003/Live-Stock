// routes/farmers.js
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Animal = require('../models/Animal');
const { protect, authorize } = require('../middleware/auth');

router.get('/', protect, async (req, res) => {
  try {
    const farmers = await User.find({ role: 'farmer', isActive: true }).select('-password').sort({ name: 1 });
    res.json(farmers);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.get('/:id', protect, async (req, res) => {
  try {
    const farmer = await User.findById(req.params.id).select('-password');
    if (!farmer) return res.status(404).json({ message: 'Farmer not found' });
    const animals = await Animal.find({ owner: req.params.id });
    res.json({ farmer, animals });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
