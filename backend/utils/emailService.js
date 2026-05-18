const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  family: 4,
  tls: {
    rejectUnauthorized: false,
    minVersion: 'TLSv1'
  },
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

const sendEmail = async (to, subject, html) => {
  try {
    await transporter.sendMail({
      from: `"Goal Portal" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html
    });
    console.log(`Email sent to ${to}`);
  } catch (err) {
    console.error('Email error:', err.message);
  }
};

const emailTemplates = {
  goalSubmitted: (employeeName, managerEmail) => ({
    to: managerEmail,
    subject: '📋 New Goals Submitted for Approval',
    html: `
      <div style="font-family: sans-serif; padding: 20px; max-width: 600px;">
        <h2 style="color: #4f46e5;">New Goals Submitted</h2>
        <p>${employeeName} has submitted their goals for your approval.</p>
        <a href="${process.env.FRONTEND_URL}/manager/approval"
           style="background: #4f46e5; color: white; padding: 10px 20px; 
                  border-radius: 8px; text-decoration: none; display: inline-block;">
          Review Goals
        </a>
      </div>
    `
  }),

  goalApproved: (employeeEmail) => ({
    to: employeeEmail,
    subject: '✅ Your Goals Have Been Approved!',
    html: `
      <div style="font-family: sans-serif; padding: 20px; max-width: 600px;">
        <h2 style="color: #48bb78;">Goals Approved!</h2>
        <p>Your goals have been approved and locked by your manager.</p>
        <a href="${process.env.FRONTEND_URL}/employee/goals"
           style="background: #48bb78; color: white; padding: 10px 20px;
                  border-radius: 8px; text-decoration: none; display: inline-block;">
          View Goals
        </a>
      </div>
    `
  }),

  goalRework: (employeeEmail, comment) => ({
    to: employeeEmail,
    subject: '🔄 Your Goals Need Revision',
    html: `
      <div style="font-family: sans-serif; padding: 20px; max-width: 600px;">
        <h2 style="color: #f56565;">Goals Returned for Rework</h2>
        <p>Your manager has returned your goals for revision.</p>
        <div style="background: #fff5f5; padding: 12px; border-radius: 8px; margin: 16px 0;">
          <strong>Manager's Comment:</strong>
          <p style="margin: 8px 0 0;">${comment}</p>
        </div>
        <a href="${process.env.FRONTEND_URL}/employee/goals"
           style="background: #f56565; color: white; padding: 10px 20px;
                  border-radius: 8px; text-decoration: none; display: inline-block;">
          Fix Goals
        </a>
      </div>
    `
  }),

  checkinReminder: (employeeEmail, employeeName, quarter) => ({
    to: employeeEmail,
    subject: `⏰ ${quarter} Check-in Reminder`,
    html: `
      <div style="font-family: sans-serif; padding: 20px; max-width: 600px;">
        <h2 style="color: #ecc94b;">${quarter} Check-in Due!</h2>
        <p>Hi ${employeeName}, the ${quarter} check-in window is now open.</p>
        <p>Please update your goal progress before the deadline.</p>
        <a href="${process.env.FRONTEND_URL}/employee/checkin"
           style="background: #ecc94b; color: white; padding: 10px 20px;
                  border-radius: 8px; text-decoration: none; display: inline-block;">
          Submit Check-in
        </a>
      </div>
    `
  })
};

module.exports = { sendEmail, emailTemplates };
