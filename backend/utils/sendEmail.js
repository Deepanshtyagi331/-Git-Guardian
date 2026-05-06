const nodemailer = require('nodemailer');

const sendEmail = async ({ to, subject, html, text }) => {
  let transporter;

  if (process.env.SMTP_SERVICE === 'gmail' || (process.env.SMTP_HOST && process.env.SMTP_HOST.includes('gmail'))) {
    // Optimized Gmail configuration
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  } else if (process.env.SMTP_HOST) {
    // Generic SMTP
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT || 587,
      secure: process.env.SMTP_PORT == 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      connectionTimeout: 10000,
    });
  } else if (process.env.NODE_ENV === 'production') {
    console.error('[Email Error] SMTP is not configured in production! Email will not be sent.');
    return; // Don't even try Ethereal in production
  } else {
    // Fallback for local development
    console.log('[Email] No SMTP configured, falling back to Ethereal test account...');
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
  }

  const mailOptions = {
    from: process.env.FROM_EMAIL || '"Git Guardian" <tyagideepansh26@gmail.com>',
    to,
    subject,
    html,
    text,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`[Email] Success! Mail sent to ${to}`);
  } catch (error) {
    console.error('-----------------------------------------');
    console.error('[Email Error] Failed to send email.');
    console.error('[Reason]', error.message);
    if (error.message.includes('Invalid login')) {
      console.error('[Action Required] Check if SMTP_USER and SMTP_PASS (App Password) are correct.');
    }
    console.error('-----------------------------------------');
  }
};

module.exports = sendEmail;
