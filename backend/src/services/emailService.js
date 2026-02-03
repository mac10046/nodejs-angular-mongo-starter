const { getTransporter } = require('../config/email');

/**
 * Email Service
 * Handles sending various types of emails
 */

class EmailService {
  constructor() {
    this.from = process.env.EMAIL_FROM || 'PROJECT-NAME <noreply@productapp.com>';
    this.frontendUrl = process.env.FRONTEND_URL || 'http://localhost:4200';
  }

  /**
   * Send an email
   * @param {Object} options - Email options
   * @param {string} options.to - Recipient email
   * @param {string} options.subject - Email subject
   * @param {string} options.html - Email HTML content
   * @param {string} options.text - Plain text content (fallback)
   */
  async sendEmail({ to, subject, html, text }) {
    const transporter = getTransporter();

    // If no transporter (dev mode without email config), log to console
    if (!transporter) {
      console.log('\n========== EMAIL (Console Mode) ==========');
      console.log(`To: ${to}`);
      console.log(`Subject: ${subject}`);
      console.log(`Content:\n${text || html}`);
      console.log('==========================================\n');
      return;
    }

    const mailOptions = {
      from: this.from,
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, ''), // Strip HTML for plain text
    };

    try {
      const info = await transporter.sendMail(mailOptions);
      console.log(`Email sent: ${info.messageId}`);
      return info;
    } catch (error) {
      console.error('Error sending email:', error.message);
      throw new Error('Failed to send email');
    }
  }

  /**
   * Send email verification email
   * @param {string} email - User's email
   * @param {string} token - Verification token
   * @param {string} name - User's name
   */
  async sendVerificationEmail(email, token, name = 'User') {
    const verificationUrl = `${this.frontendUrl}/verify-email/${token}`;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verify Your Email</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #4F46E5; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; background: #4F46E5; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Verify Your Email</h1>
          </div>
          <div class="content">
            <p>Hi ${name},</p>
            <p>Thank you for registering! Please verify your email address by clicking the button below:</p>
            <p style="text-align: center;">
              <a href="${verificationUrl}" class="button" style="color: white;">Verify Email</a>
            </p>
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #4F46E5;">${verificationUrl}</p>
            <p>This link will expire in 24 hours.</p>
            <p>If you didn't create an account, you can safely ignore this email.</p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} PROJECT-NAME. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
Hi ${name},

Thank you for registering! Please verify your email address by visiting the link below:

${verificationUrl}

This link will expire in 24 hours.

If you didn't create an account, you can safely ignore this email.

- PROJECT-NAME Team
    `;

    await this.sendEmail({
      to: email,
      subject: 'Verify Your Email - PROJECT-NAME',
      html,
      text,
    });
  }

  /**
   * Send password reset email
   * @param {string} email - User's email
   * @param {string} token - Reset token
   * @param {string} name - User's name
   */
  async sendPasswordResetEmail(email, token, name = 'User') {
    const resetUrl = `${this.frontendUrl}/reset-password/${token}`;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reset Your Password</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #DC2626; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; background: #DC2626; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 14px; }
          .warning { background: #FEF3C7; border: 1px solid #F59E0B; padding: 15px; border-radius: 6px; margin: 15px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Password Reset Request</h1>
          </div>
          <div class="content">
            <p>Hi ${name},</p>
            <p>We received a request to reset your password. Click the button below to create a new password:</p>
            <p style="text-align: center;">
              <a href="${resetUrl}" class="button" style="color: white;">Reset Password</a>
            </p>
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #DC2626;">${resetUrl}</p>
            <div class="warning">
              <strong>Important:</strong> This link will expire in 1 hour for security reasons.
            </div>
            <p>If you didn't request a password reset, please ignore this email or contact support if you have concerns.</p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} PROJECT-NAME. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
Hi ${name},

We received a request to reset your password. Visit the link below to create a new password:

${resetUrl}

This link will expire in 1 hour for security reasons.

If you didn't request a password reset, please ignore this email or contact support if you have concerns.

- PROJECT-NAME Team
    `;

    await this.sendEmail({
      to: email,
      subject: 'Password Reset Request - PROJECT-NAME',
      html,
      text,
    });
  }

  /**
   * Send password changed notification email
   * @param {string} email - User's email
   * @param {string} name - User's name
   */
  async sendPasswordChangedEmail(email, name = 'User') {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Changed</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #059669; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 14px; }
          .warning { background: #FEE2E2; border: 1px solid #EF4444; padding: 15px; border-radius: 6px; margin: 15px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Password Changed Successfully</h1>
          </div>
          <div class="content">
            <p>Hi ${name},</p>
            <p>Your password has been changed successfully.</p>
            <p>If you made this change, you can safely ignore this email.</p>
            <div class="warning">
              <strong>Didn't make this change?</strong><br>
              If you didn't change your password, your account may be compromised. Please contact our support team immediately.
            </div>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} PROJECT-NAME. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
Hi ${name},

Your password has been changed successfully.

If you made this change, you can safely ignore this email.

If you didn't change your password, your account may be compromised. Please contact our support team immediately.

- PROJECT-NAME Team
    `;

    await this.sendEmail({
      to: email,
      subject: 'Password Changed - PROJECT-NAME',
      html,
      text,
    });
  }

  /**
   * Send welcome email after successful registration
   * @param {string} email - User's email
   * @param {string} name - User's name
   */
  async sendWelcomeEmail(email, name = 'User') {
    const loginUrl = `${this.frontendUrl}/login`;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome!</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #4F46E5; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; background: #4F46E5; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to PROJECT-NAME!</h1>
          </div>
          <div class="content">
            <p>Hi ${name},</p>
            <p>Your email has been verified successfully. Welcome to PROJECT-NAME!</p>
            <p>You can now log in to your account and start using our services.</p>
            <p style="text-align: center;">
              <a href="${loginUrl}" class="button" style="color: white;">Log In Now</a>
            </p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} PROJECT-NAME. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
Hi ${name},

Your email has been verified successfully. Welcome to PROJECT-NAME!

You can now log in to your account: ${loginUrl}

- PROJECT-NAME Team
    `;

    await this.sendEmail({
      to: email,
      subject: 'Welcome to PROJECT-NAME!',
      html,
      text,
    });
  }
}

module.exports = new EmailService();
