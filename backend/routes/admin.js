const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Animal = require('../models/Animal');
const Treatment = require('../models/Treatment');
const { protect, authorize } = require('../middleware/auth');

// GET /api/admin/dashboard - system overview stats
router.get('/dashboard', protect, authorize('admin'), async (req, res) => {
  try {
    const [farmers, vets, pharmacists, inspectors, centers, animals, treatments] = await Promise.all([
      User.countDocuments({ role: 'farmer' }),
      User.countDocuments({ role: 'vet' }),
      User.countDocuments({ role: 'pharmacist' }),
      User.countDocuments({ role: 'inspector' }),
      User.countDocuments({ role: { $in: ['slaughterhouse', 'milk_center'] } }),
      Animal.countDocuments(),
      Treatment.countDocuments()
    ]);
    const restrictedAnimals = await Animal.countDocuments({ status: 'restricted' });

    res.json({ farmers, vets, pharmacists, inspectors, centers, animals, treatments, restrictedAnimals });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/admin/users - list all users with filters
router.get('/users', protect, authorize('admin'), async (req, res) => {
  try {
    const query = {};
    if (req.query.role) query.role = req.query.role;
    if (req.query.isActive !== undefined) query.isActive = req.query.isActive === 'true';
    const users = await User.find(query).select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/admin/inspectors - admin creates inspector account
router.post('/inspectors', protect, authorize('admin'), async (req, res) => {
  try {
    const { name, email, password, phone, sector } = req.body;
    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: 'Email already registered' });

    const inspector = await User.create({
      name, email, password: password || 'Inspector@1234',
      role: 'inspector', phone,
      location: { sector },
      isApproved: true,
      createdBy: req.user._id
    });
    res.status(201).json(inspector);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/admin/users/:id/toggle-active - activate/deactivate user
router.put('/users/:id/toggle-active', protect, authorize('admin'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    user.isActive = !user.isActive;
    await user.save();
    res.json({ message: `User ${user.isActive ? 'activated' : 'deactivated'}`, user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/admin/users/:id
router.delete('/users/:id', protect, authorize('admin'), async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
