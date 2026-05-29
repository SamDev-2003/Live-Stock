const mongoose = require('mongoose');

const sectorSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, trim: true },
  createdAt: { type: Date, default: Date.now }
});

const cellSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  sector: { type: mongoose.Schema.Types.ObjectId, ref: 'Sector', required: true },
  createdAt: { type: Date, default: Date.now }
});

const villageSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  cell: { type: mongoose.Schema.Types.ObjectId, ref: 'Cell', required: true },
  sector: { type: mongoose.Schema.Types.ObjectId, ref: 'Sector', required: true },
  createdAt: { type: Date, default: Date.now }
});

const Sector  = mongoose.model('Sector', sectorSchema);
const Cell    = mongoose.model('Cell', cellSchema);
const Village = mongoose.model('Village', villageSchema);

module.exports = { Sector, Cell, Village };
