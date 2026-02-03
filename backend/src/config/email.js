const nodemailer = require('nodemailer');

/**
 * Email Configuration
 *
 * Gmail Setup Instructions:
 * 1. Enable 2-Factor Authentication on your Google Account
 * 2. Go to: https://myaccount.google.com/apppasswords
 * 3. Generate an App Password for "Mail" on "Windows Computer"
 * 4. Use the 16-character password as EMAIL_PASS in .env
 *
 * For production, consider using:
 * - SendGrid: https://sendgrid.com/
 * - AWS SES: https://aws.amazon.com/ses/
 * - Mailgun: https://www.mailgun.com/
 */

let transporter = null;

const createTransporter = () => {
  if (transporter) {
    return transporter;
  }

  // Development mode - log emails to console
  if (process.env.NODE_ENV === 'development' && !process.env.EMAIL_USER) {
    console.log('Email not configured - emails will be logged to console');
    return null;
  }

  transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  // Verify connection
  transporter.verify((error, success) => {
    if (error) {
      console.error('Email transporter verification failed:', error.message);
    } else {
      console.log('Email transporter is ready');
    }
  });

  return transporter;
};

const getTransporter = () => {
  if (!transporter) {
    return createTransporter();
  }
  return transporter;
};

module.exports = {
  createTransporter,
  getTransporter,
};
