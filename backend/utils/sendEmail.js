const nodemailer = require('nodemailer');

const sendEmail = async ({ to, subject, html, text }) => {
  let transporter;

  console.log(`[Email Debug] Attempting to send email to: ${to}`);
  console.log(`[Email Debug] SMTP_HOST: ${process.env.SMTP_HOST}`);
  console.log(`[Email Debug] SMTP_SERVICE: ${process.env.SMTP_SERVICE}`);

  if (process.env.SMTP_SERVICE === 'gmail' || (process.env.SMTP_HOST && process.env.SMTP_HOST.includes('gmail'))) {
    console.log('[Email Debug] Using Gmail configuration branch');
    transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true, // Use SSL
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      tls: {
        rejectUnauthorized: false // Helps in some restricted environments
      }
    });
  } else if (process.env.SMTP_HOST) {
    console.log(`[Email Debug] Using Generic SMTP configuration branch: ${process.env.SMTP_HOST}`);
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
    console.error('[Email Error] CRITICAL: SMTP is not configured in production! (No SMTP_HOST or SMTP_SERVICE found)');
    return;
  } else {
    console.log('[Email Debug] Using Ethereal fallback branch');
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
    text: text || 'Please verify your account.',
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`[Email] Success! Mail sent to ${to}. Message ID: ${info.messageId}`);
  } catch (error) {
    console.error('-----------------------------------------');
    console.error('[Email Error] Failed to send email.');
    console.error('[Reason]', error.message);
    console.error('[Stack]', error.stack);
    if (error.message.includes('Invalid login')) {
      console.error('[Action Required] Your Gmail App Password may be invalid or expired.');
    }
    console.error('-----------------------------------------');
  }
};

module.exports = sendEmail;
