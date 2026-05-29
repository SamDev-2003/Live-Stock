const express = require('express');
const router = express.Router();
const Animal = require('../models/Animal');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');
const { sendEmail, templates } = require('../utils/email');

// GET /api/animals - farmer gets their animals, others get all/filtered
router.get('/', protect, async (req, res) => {
  try {
    let query = {};
    if (req.user.role === 'farmer') query.owner = req.user._id;
    if (req.query.owner) query.owner = req.query.owner;
    if (req.query.status) query.status = req.query.status;

    const animals = await Animal.find(query)
      .populate('owner', 'name email phone')
      .sort({ createdAt: -1 });
    res.json(animals);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/animals - farmer registers animal
router.post('/', protect, authorize('farmer'), upload.single('profileImage'), async (req, res) => {
  try {
    const { animalType, breed, tagNumber, gender, dateOfBirth } = req.body;
    const animal = await Animal.create({
      owner: req.user._id,
      animalType, breed, tagNumber, gender, dateOfBirth,
      profileImage: req.file ? `/uploads/${req.file.filename}` : null
    });
    res.status(201).json(animal);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/animals/:id
router.get('/:id', protect, async (req, res) => {
  try {
    const animal = await Animal.findById(req.params.id).populate('owner', 'name email phone location');
    if (!animal) return res.status(404).json({ message: 'Animal not found' });
    res.json(animal);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/animals/:id - update animal
router.put('/:id', protect, authorize('farmer', 'admin'), upload.single('profileImage'), async (req, res) => {
  try {
    const animal = await Animal.findById(req.params.id);
    if (!animal) return res.status(404).json({ message: 'Animal not found' });
    if (req.user.role === 'farmer' && animal.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    const { animalType, breed, tagNumber, gender, dateOfBirth } = req.body;
    Object.assign(animal, { animalType, breed, tagNumber, gender, dateOfBirth });
    if (req.file) animal.profileImage = `/uploads/${req.file.filename}`;
    await animal.save();
    res.json(animal);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/animals/:id/report-issue - farmer reports animal problem
router.post('/:id/report-issue', protect, authorize('farmer'), async (req, res) => {
  try {
    const animal = await Animal.findById(req.params.id).populate('owner', 'name location');
    if (!animal) return res.status(404).json({ message: 'Animal not found' });
    if (animal.owner._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not your animal' });
    }

    animal.issueReports.push({
      description: req.body.description,
      reportedBy: req.user._id
    });
    await animal.save();

    // Notify all vets in the system
    const vets = await User.find({ role: 'vet', isActive: true });
    const locationStr = req.user.location?.address || 'unknown location';

    for (const vet of vets) {
      await Notification.create({
        recipient: vet._id,
        type: 'animal_issue',
        title: 'Animal Issue Reported',
        message: `${req.user.name} reported an issue with their ${animal.animalType}: ${req.body.description}`,
        relatedAnimal: animal._id,
        relatedUser: req.user._id
      });
      await sendEmail({
        to: vet.email,
        subject: 'Animal Issue Reported - Action Required',
        html: templates.animalIssueToVet(req.user.name, animal.animalType, req.body.description, locationStr)
      });
    }

    res.json({ message: 'Issue reported and vets notified', animal });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/animals/:id/status - admin/inspector/vet can update status
router.put('/:id/status', protect, authorize('admin', 'inspector', 'vet'), async (req, res) => {
  try {
    const { status, restrictionReason, restrictionUntil } = req.body;
    const animal = await Animal.findById(req.params.id).populate('owner', 'name email');
    if (!animal) return res.status(404).json({ message: 'Animal not found' });

    animal.status = status;
    if (status === 'restricted') {
      animal.restrictionReason = restrictionReason;
      animal.restrictionUntil = restrictionUntil ? new Date(restrictionUntil) : null;

      await Notification.create({
        recipient: animal.owner._id,
        type: 'withdrawal_active',
        title: 'Animal Restricted',
        message: `Your ${animal.animalType} has been restricted: ${restrictionReason}`,
        relatedAnimal: animal._id
      });
      await sendEmail({
        to: animal.owner.email,
        subject: 'Animal Restriction Notice',
        html: templates.withdrawalWarning(
          `${animal.animalType} (${animal.breed || ''})`,
          restrictionReason,
          restrictionUntil || 'TBD'
        )
      });
    }
    await animal.save();
    res.json(animal);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
