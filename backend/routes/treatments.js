const express = require('express');
const router = express.Router();
const Treatment = require('../models/Treatment');
const Animal = require('../models/Animal');
const Notification = require('../models/Notification');
const { protect, authorize } = require('../middleware/auth');
const { sendEmail, templates } = require('../utils/email');

// GET /api/treatments - get all or filtered treatments
router.get('/', protect, async (req, res) => {
  try {
    const query = {};
    if (req.user.role === 'vet') query.vet = req.user._id;
    if (req.user.role === 'farmer') query.farmer = req.user._id;
    if (req.query.animalId) query.animal = req.query.animalId;
    if (req.query.farmerId) query.farmer = req.query.farmerId;

    const treatments = await Treatment.find(query)
      .populate('animal', 'animalType breed profileImage status')
      .populate('vet', 'name email')
      .populate('farmer', 'name email phone')
      .populate('medications.medicine', 'name')
      .sort({ treatmentDate: -1 });
    res.json(treatments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/treatments - vet records treatment
router.post('/', protect, authorize('vet'), async (req, res) => {
  try {
    const { animalId, farmerId, diagnosis, symptoms, medications, followUpDate, withdrawalPeriodDays, notes } = req.body;

    const animal = await Animal.findById(animalId).populate('owner', 'name email');
    if (!animal) return res.status(404).json({ message: 'Animal not found' });

    // Calculate withdrawal end date
    const withdrawalEnd = withdrawalPeriodDays > 0
      ? new Date(Date.now() + withdrawalPeriodDays * 24 * 60 * 60 * 1000)
      : null;

    const treatment = await Treatment.create({
      animal: animalId,
      vet: req.user._id,
      farmer: farmerId || animal.owner._id,
      diagnosis, symptoms, medications, followUpDate,
      withdrawalPeriodDays: withdrawalPeriodDays || 0,
      withdrawalEndDate: withdrawalEnd,
      notes
    });

    // Update animal status
    if (withdrawalPeriodDays > 0) {
      await Animal.findByIdAndUpdate(animalId, {
        status: 'restricted',
        restrictionReason: `Veterinary treatment: ${diagnosis}`,
        restrictionUntil: withdrawalEnd
      });

      await sendEmail({
        to: animal.owner.email,
        subject: 'Animal Treatment Restriction',
        html: templates.withdrawalWarning(
          `${animal.animalType}`, `Veterinary treatment: ${diagnosis}`,
          withdrawalEnd.toLocaleDateString()
        )
      });
    } else {
      await Animal.findByIdAndUpdate(animalId, { status: 'under_treatment' });
    }

    // Notify farmer
    await Notification.create({
      recipient: animal.owner._id,
      type: 'treatment_record',
      title: 'Treatment Recorded',
      message: `Dr. ${req.user.name} recorded a treatment for your ${animal.animalType}: ${diagnosis}`,
      relatedAnimal: animalId,
      relatedUser: req.user._id
    });

    const populated = await Treatment.findById(treatment._id)
      .populate('animal', 'animalType breed')
      .populate('vet', 'name email')
      .populate('farmer', 'name email');

    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/treatments/:id - update treatment record
router.put('/:id', protect, authorize('vet', 'admin'), async (req, res) => {
  try {
    const treatment = await Treatment.findByIdAndUpdate(req.params.id, req.body, { new: true })
      .populate('animal', 'animalType breed')
      .populate('vet', 'name email')
      .populate('farmer', 'name email');
    if (!treatment) return res.status(404).json({ message: 'Treatment not found' });
    res.json(treatment);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/treatments/:id
router.get('/:id', protect, async (req, res) => {
  try {
    const treatment = await Treatment.findById(req.params.id)
      .populate('animal', 'animalType breed profileImage status')
      .populate('vet', 'name email')
      .populate('farmer', 'name email phone')
      .populate('medications.medicine', 'name');
    if (!treatment) return res.status(404).json({ message: 'Treatment not found' });
    res.json(treatment);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
