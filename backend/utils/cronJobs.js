const MedicineSale = require('../models/MedicineSale');
const Animal = require('../models/Animal');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { sendEmail, templates } = require('./email');

// Send feeding reminders for upcoming doses
const sendFeedingReminders = async () => {
  try {
    const now = new Date();
    const inOneHour = new Date(now.getTime() + 60 * 60 * 1000);

    const sales = await MedicineSale.find({ status: 'active' })
      .populate('medicine', 'name')
      .populate('farmer', 'name email')
      .populate('animal', 'animalType breed');

    for (const sale of sales) {
      for (const dose of sale.feedingSchedule) {
        if (!dose.givenAt && !dose.reminderSent && dose.scheduledAt >= now && dose.scheduledAt <= inOneHour) {
          const animalName = sale.animal ? `${sale.animal.animalType} (${sale.animal.breed || ''})` : 'your animal';
          const medicineName = sale.medicine?.name || 'medicine';
          const timeStr = dose.scheduledAt.toLocaleString();

          // In-app notification
          await Notification.create({
            recipient: sale.farmer._id,
            type: 'feeding_reminder',
            title: 'Feeding Reminder',
            message: `Time to administer ${medicineName} to ${animalName} at ${timeStr}`,
            relatedAnimal: sale.animal?._id
          });

          // Email
          await sendEmail({
            to: sale.farmer.email,
            subject: `Feeding Reminder: ${medicineName}`,
            html: templates.feedingReminder(animalName, medicineName, timeStr)
          });

          dose.reminderSent = true;
        }
      }
      await sale.save();
    }
    console.log('[CRON] Feeding reminders checked');
  } catch (err) {
    console.error('[CRON] Feeding reminder error:', err.message);
  }
};

// Check medicine expiry - warn 7 days before
const checkMedicineExpiry = async () => {
  try {
    const now = new Date();
    const inSevenDays = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const expiringSales = await MedicineSale.find({
      status: 'active',
      expirationDate: { $gte: now, $lte: inSevenDays }
    }).populate('medicine', 'name').populate('farmer', 'name email');

    for (const sale of expiringSales) {
      const medicineName = sale.medicine?.name || 'medicine';
      const expiryStr = sale.expirationDate.toLocaleDateString();

      await Notification.create({
        recipient: sale.farmer._id,
        type: 'medicine_expiry',
        title: 'Medicine Expiring Soon',
        message: `${medicineName} expires on ${expiryStr}. Please take action.`
      });

      await sendEmail({
        to: sale.farmer.email,
        subject: `Medicine Expiry Warning: ${medicineName}`,
        html: templates.medicineExpiry(medicineName, expiryStr)
      });

      // Mark animal restricted if not already
      if (sale.animal) {
        await Animal.findByIdAndUpdate(sale.animal, {
          status: 'restricted',
          restrictionReason: `Medicine ${medicineName} expiring`,
          restrictionUntil: sale.expirationDate
        });
      }
    }
    console.log('[CRON] Medicine expiry checked');
  } catch (err) {
    console.error('[CRON] Medicine expiry error:', err.message);
  }
};

// Check if withdrawal periods have ended - lift restrictions
const checkWithdrawalCompliance = async () => {
  try {
    const now = new Date();

    // Find animals whose restriction has ended
    const animals = await Animal.find({
      status: 'restricted',
      restrictionUntil: { $lte: now }
    }).populate('owner', 'name email');

    for (const animal of animals) {
      animal.status = 'healthy';
      animal.restrictionReason = null;
      animal.restrictionUntil = null;
      await animal.save();

      const animalName = `${animal.animalType} (${animal.breed || ''})`;

      await Notification.create({
        recipient: animal.owner._id,
        type: 'withdrawal_lifted',
        title: 'Animal Restriction Lifted',
        message: `Your ${animalName} is now cleared for milk collection and slaughter.`,
        relatedAnimal: animal._id
      });

      await sendEmail({
        to: animal.owner.email,
        subject: 'Animal Restriction Lifted',
        html: templates.withdrawalLifted(animalName)
      });
    }

    console.log('[CRON] Withdrawal compliance checked, lifted:', animals.length);
  } catch (err) {
    console.error('[CRON] Withdrawal check error:', err.message);
  }
};

module.exports = { sendFeedingReminders, checkMedicineExpiry, checkWithdrawalCompliance };
