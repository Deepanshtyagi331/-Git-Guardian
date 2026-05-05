const nodemailer = require('nodemailer');

const sendEmail = async ({ to, subject, html, text }) => {
  let transporter;

  if (process.env.SMTP_HOST && process.env.SMTP_HOST.includes('gmail')) {
    // Explicit Gmail configuration with Port 587 (TLS)
    transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false, // Use TLS
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      connectionTimeout: 10000, // 10 seconds
      greetingTimeout: 10000,
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
  } else {
    // Fallback for local development
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
    from: process.env.FROM_EMAIL || '"Git Guardian" <[tyagideepansh26@gmail.com]>',
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
    console.error('[Email Error] Google rejected the login.');
    console.error('[Reason]', error.message);
    console.error('-----------------------------------------');
  }
};

module.exports = sendEmail;
