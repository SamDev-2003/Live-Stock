const express = require('express');
const router = express.Router();
const Medicine = require('../models/Medicine');
const MedicineSale = require('../models/MedicineSale');
const Animal = require('../models/Animal');
const Notification = require('../models/Notification');
const { protect, authorize } = require('../middleware/auth');
const { sendEmail, templates } = require('../utils/email');

// GET /api/medicines - list medicines
router.get('/', protect, async (req, res) => {
  try {
    const query = {};
    if (req.user.role === 'pharmacist') query.registeredBy = req.user._id;
    const medicines = await Medicine.find(query).populate('registeredBy', 'name').sort({ createdAt: -1 });
    res.json(medicines);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/medicines - pharmacist registers medicine/food
router.post('/', protect, authorize('pharmacist'), async (req, res) => {
  try {
    const medicine = await Medicine.create({ ...req.body, registeredBy: req.user._id });
    res.status(201).json(medicine);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/medicines/:id - update medicine
router.put('/:id', protect, authorize('pharmacist', 'admin'), async (req, res) => {
  try {
    const medicine = await Medicine.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!medicine) return res.status(404).json({ message: 'Medicine not found' });
    res.json(medicine);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/medicines/sell - pharmacist sells and assigns medicine to farmer
router.post('/sell', protect, authorize('pharmacist'), async (req, res) => {
  try {
    const { medicineId, farmerId, animalId, quantity, totalDoses, startDate, notes } = req.body;

    const medicine = await Medicine.findById(medicineId);
    if (!medicine) return res.status(404).json({ message: 'Medicine not found' });
    if (medicine.stockQuantity < quantity) {
      return res.status(400).json({ message: 'Insufficient stock' });
    }

    // Build feeding schedule
    const start = new Date(startDate);
    const schedule = [];
    for (let i = 0; i < totalDoses; i++) {
      schedule.push({
        scheduledAt: new Date(start.getTime() + i * medicine.feedingIntervalHours * 60 * 60 * 1000),
        givenAt: null,
        reminderSent: false
      });
    }

    const withdrawalEnd = new Date(
      start.getTime() + totalDoses * medicine.feedingIntervalHours * 60 * 60 * 1000 +
      medicine.withdrawalPeriodDays * 24 * 60 * 60 * 1000
    );

    const sale = await MedicineSale.create({
      medicine: medicineId,
      pharmacist: req.user._id,
      farmer: farmerId,
      animal: animalId || null,
      quantity, totalDoses,
      startDate: start,
      nextFeedingTime: start,
      feedingSchedule: schedule,
      expirationDate: medicine.expirationDate,
      withdrawalPeriodDays: medicine.withdrawalPeriodDays,
      withdrawalEndDate: withdrawalEnd,
      notes
    });

    // Reduce stock
    medicine.stockQuantity -= quantity;
    await medicine.save();

    // Mark animal restricted if withdrawal period > 0
    if (animalId && medicine.withdrawalPeriodDays > 0) {
      const animal = await Animal.findByIdAndUpdate(animalId, {
        status: 'restricted',
        restrictionReason: `Under treatment with ${medicine.name}`,
        restrictionUntil: withdrawalEnd
      }, { new: true }).populate('owner', 'name email');

      if (animal) {
        await Notification.create({
          recipient: animal.owner._id,
          type: 'withdrawal_active',
          title: 'Animal Marked Restricted',
          message: `Your ${animal.animalType} is restricted due to ${medicine.name} treatment until ${withdrawalEnd.toLocaleDateString()}`,
          relatedAnimal: animal._id
        });
        await sendEmail({
          to: animal.owner.email,
          subject: 'Animal Restriction Notice',
          html: templates.withdrawalWarning(
            `${animal.animalType}`, `Treatment with ${medicine.name}`,
            withdrawalEnd.toLocaleDateString()
          )
        });
      }
    }

    const populated = await MedicineSale.findById(sale._id)
      .populate('medicine', 'name type')
      .populate('farmer', 'name email')
      .populate('animal', 'animalType breed');

    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/medicines/sales - get sales records
router.get('/sales', protect, async (req, res) => {
  try {
    const query = {};
    if (req.user.role === 'pharmacist') query.pharmacist = req.user._id;
    if (req.user.role === 'farmer') query.farmer = req.user._id;
    if (req.query.farmerId) query.farmer = req.query.farmerId;

    const sales = await MedicineSale.find(query)
      .populate('medicine', 'name type feedingInstructions')
      .populate('farmer', 'name email phone')
      .populate('animal', 'animalType breed')
      .populate('pharmacist', 'name')
      .sort({ createdAt: -1 });
    res.json(sales);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/medicines/sales/:id/confirm-dose - farmer confirms dose given
router.put('/sales/:id/confirm-dose', protect, authorize('farmer'), async (req, res) => {
  try {
    const { doseIndex } = req.body;
    const sale = await MedicineSale.findById(req.params.id);
    if (!sale) return res.status(404).json({ message: 'Sale not found' });
    if (sale.farmer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (sale.feedingSchedule[doseIndex]) {
      sale.feedingSchedule[doseIndex].givenAt = new Date();
      sale.dosesGiven += 1;
      if (sale.dosesGiven >= sale.totalDoses) sale.status = 'completed';
    }
    await sale.save();
    res.json(sale);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
