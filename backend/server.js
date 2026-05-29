const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const cron = require('node-cron');

dotenv.config();

const app = express();

// Middleware
app.use(cors({ origin: process.env.CLIENT_URL || '*', credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth',       require('./routes/auth'));
app.use('/api/farmers',    require('./routes/farmers'));
app.use('/api/animals',    require('./routes/animals'));
app.use('/api/pharmacists',require('./routes/pharmacists'));
app.use('/api/medicines',  require('./routes/medicines'));
app.use('/api/vets',       require('./routes/vets'));
app.use('/api/treatments', require('./routes/treatments'));
app.use('/api/centers',    require('./routes/centers'));
app.use('/api/inspectors', require('./routes/inspectors'));
app.use('/api/admin',      require('./routes/admin'));
app.use('/api/locations',  require('./routes/locations'));
app.use('/api/notifications', require('./routes/notifications'));

app.get('/', (req, res) => res.json({ message: 'Livestock API running' }));

// MongoDB connection + seed admin
mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log('MongoDB connected');
    await require('./utils/seedAdmin')();

    // Cron: check medicine expiry & feeding reminders every hour
    cron.schedule('0 * * * *', async () => {
      await require('./utils/cronJobs').checkMedicineExpiry();
      await require('./utils/cronJobs').sendFeedingReminders();
    });

    // Cron: daily withdrawal compliance check at 8am
    cron.schedule('0 8 * * *', async () => {
      await require('./utils/cronJobs').checkWithdrawalCompliance();
    });

    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });
