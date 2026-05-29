// routes/inspectors.js
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Animal = require('../models/Animal');
const Treatment = require('../models/Treatment');
const { protect, authorize } = require('../middleware/auth');

router.get('/', protect, authorize('admin'), async (req, res) => {
  try {
    const inspectors = await User.find({ role: 'inspector' }).select('-password').sort({ name: 1 });
    res.json(inspectors);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Inspector dashboard - overview of their sector
router.get('/overview', protect, authorize('inspector', 'admin'), async (req, res) => {
  try {
    const vets = await User.find({ role: 'vet', isActive: true }).countDocuments();
    const pharmacists = await User.find({ role: 'pharmacist', isActive: true }).countDocuments();
    const restrictedAnimals = await Animal.find({ status: 'restricted' })
      .populate('owner', 'name email').limit(20);
    const recentTreatments = await Treatment.find()
      .populate('animal', 'animalType breed')
      .populate('vet', 'name')
      .populate('farmer', 'name')
      .sort({ treatmentDate: -1 }).limit(20);
    res.json({ vets, pharmacists, restrictedAnimals, recentTreatments });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
