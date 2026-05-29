const User = require('../models/User');

const seedAdmin = async () => {
  try {
    const existing = await User.findOne({ role: 'admin' });
    if (existing) return;

    await User.create({
      name: 'System Administrator',
      email: process.env.ADMIN_EMAIL || 'admin@livestock.rw',
      password: process.env.ADMIN_PASSWORD || 'Admin@1234',
      role: 'admin',
      isActive: true,
      isApproved: true
    });
    console.log('✅ Admin user seeded:', process.env.ADMIN_EMAIL);
  } catch (err) {
    console.error('Admin seed error:', err.message);
  }
};

module.exports = seedAdmin;
