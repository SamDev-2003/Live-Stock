const express = require('express');
const router = express.Router();
const Stakeholder = require('../models/Stakeholder');
const Animal = require('../models/Animal');
const Treatment = require('../models/Treatment');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { protect, authorize } = require('../middleware/auth');

// GET /api/centers - list all centers
router.get('/', protect, async (req, res) => {
  try {
    const centers = await User.find({ role: { $in: ['slaughterhouse', 'milk_center'] }, isActive: true })
      .select('-password').sort({ createdAt: -1 });
    res.json(centers);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/centers/stakeholders - farmer requests to join a center
router.post('/stakeholders', protect, authorize('farmer'), async (req, res) => {
  try {
    const { centerId } = req.body;
    const existing = await Stakeholder.findOne({ center: centerId, farmer: req.user._id });
    if (existing) return res.status(400).json({ message: 'Request already sent' });

    const stakeholder = await Stakeholder.create({ center: centerId, farmer: req.user._id });

    await Notification.create({
      recipient: centerId,
      type: 'new_stakeholder',
      title: 'New Farmer Request',
      message: `${req.user.name} has requested to become your stakeholder.`,
      relatedUser: req.user._id
    });

    res.status(201).json(stakeholder);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/centers/stakeholders - center sees their farmers
router.get('/stakeholders', protect, authorize('slaughterhouse', 'milk_center', 'admin', 'inspector'), async (req, res) => {
  try {
    const query = {};
    if (req.user.role === 'slaughterhouse' || req.user.role === 'milk_center') {
      query.center = req.user._id;
    }
    if (req.query.centerId) query.center = req.query.centerId;
    if (req.query.status) query.status = req.query.status;

    const stakeholders = await Stakeholder.find(query)
      .populate('farmer', 'name email phone location profileImage')
      .populate('center', 'name role location')
      .sort({ createdAt: -1 });
    res.json(stakeholders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/centers/stakeholders/:id - center approves/rejects farmer
router.put('/stakeholders/:id', protect, authorize('slaughterhouse', 'milk_center', 'admin'), async (req, res) => {
  try {
    const { status, notes } = req.body;
    const stakeholder = await Stakeholder.findById(req.params.id).populate('farmer', 'name email');
    if (!stakeholder) return res.status(404).json({ message: 'Stakeholder request not found' });

    stakeholder.status = status;
    stakeholder.notes = notes;
    if (status === 'approved') stakeholder.approvedAt = new Date();
    await stakeholder.save();

    await Notification.create({
      recipient: stakeholder.farmer._id,
      type: 'new_stakeholder',
      title: `Stakeholder Request ${status.charAt(0).toUpperCase() + status.slice(1)}`,
      message: `Your request to join the center has been ${status}.`,
      relatedUser: stakeholder.center
    });

    res.json(stakeholder);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/centers/farmers/:farmerId/compliance - center checks farmer's animals compliance
router.get('/farmers/:farmerId/compliance', protect, authorize('slaughterhouse', 'milk_center', 'inspector', 'admin'), async (req, res) => {
  try {
    const { farmerId } = req.params;
    const animals = await Animal.find({ owner: farmerId })
      .populate('owner', 'name email');

    const treatments = await Treatment.find({ farmer: farmerId })
      .populate('animal', 'animalType breed')
      .populate('vet', 'name')
      .sort({ treatmentDate: -1 });

    const restricted = animals.filter(a => a.status === 'restricted');
    const cleared = animals.filter(a => a.status === 'healthy');

    res.json({
      animals,
      restricted,
      cleared,
      treatments,
      summary: {
        total: animals.length,
        restricted: restricted.length,
        cleared: cleared.length,
        canSell: restricted.length === 0
      }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
