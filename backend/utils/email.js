const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

const sendEmail = async ({ to, subject, html }) => {
  try {
    await transporter.sendMail({
      from: `"Livestock Platform" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html
    });
    return true;
  } catch (err) {
    console.error('Email send error:', err.message);
    return false;
  }
};

// Email templates
const templates = {
  feedingReminder: (animalName, medicineName, time) => `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px">
      <h2 style="color:#2d6a4f">🐄 Feeding Reminder</h2>
      <p>It's time to administer <strong>${medicineName}</strong> to your animal <strong>${animalName}</strong>.</p>
      <p><strong>Scheduled time:</strong> ${time}</p>
      <p style="color:#888;font-size:12px">Please log in to the platform to confirm administration.</p>
    </div>`,

  medicineExpiry: (medicineName, expiryDate) => `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px">
      <h2 style="color:#d62828">⚠️ Medicine Expiry Warning</h2>
      <p>The medicine <strong>${medicineName}</strong> is expiring on <strong>${expiryDate}</strong>.</p>
      <p>Please take appropriate action to avoid using expired medicine.</p>
    </div>`,

  animalIssueToVet: (farmerName, animalType, description, location) => `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px">
      <h2 style="color:#e76f51">🚨 Animal Issue Reported</h2>
      <p>Farmer <strong>${farmerName}</strong> has reported an issue with their <strong>${animalType}</strong>.</p>
      <p><strong>Description:</strong> ${description}</p>
      <p><strong>Location:</strong> ${location}</p>
      <p>Please log in to the platform to view details and respond.</p>
    </div>`,

  withdrawalWarning: (animalName, reason, until) => `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px">
      <h2 style="color:#d62828">⛔ Animal Restricted</h2>
      <p>Your animal <strong>${animalName}</strong> has been marked as <strong>RESTRICTED</strong>.</p>
      <p><strong>Reason:</strong> ${reason}</p>
      <p><strong>Restriction ends:</strong> ${until}</p>
      <p>This animal cannot be used for milk collection or sent to slaughter during this period.</p>
    </div>`,

  withdrawalLifted: (animalName) => `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px">
      <h2 style="color:#2d6a4f">✅ Restriction Lifted</h2>
      <p>Your animal <strong>${animalName}</strong> is no longer restricted. It is now cleared for normal use.</p>
    </div>`
};

module.exports = { sendEmail, templates };
