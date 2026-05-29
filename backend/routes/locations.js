// routes/locations.js
const express = require('express');
const router = express.Router();
const { Sector, Cell, Village } = require('../models/Location');
const { protect, authorize } = require('../middleware/auth');

router.get('/sectors', async (req, res) => {
  res.json(await Sector.find().sort('name'));
});
router.get('/sectors/:id/cells', async (req, res) => {
  res.json(await Cell.find({ sector: req.params.id }).sort('name'));
});
router.get('/cells/:id/villages', async (req, res) => {
  res.json(await Village.find({ cell: req.params.id }).sort('name'));
});

router.post('/sectors', protect, authorize('admin'), async (req, res) => {
  try {
    const sector = await Sector.create({ name: req.body.name });
    res.status(201).json(sector);
  } catch (err) { res.status(500).json({ message: err.message }); }
});
router.post('/cells', protect, authorize('admin'), async (req, res) => {
  try {
    const cell = await Cell.create({ name: req.body.name, sector: req.body.sectorId });
    res.status(201).json(cell);
  } catch (err) { res.status(500).json({ message: err.message }); }
});
router.post('/villages', protect, authorize('admin'), async (req, res) => {
  try {
    const village = await Village.create({ name: req.body.name, cell: req.body.cellId, sector: req.body.sectorId });
    res.status(201).json(village);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
