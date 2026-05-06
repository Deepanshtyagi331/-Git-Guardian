const nodemailer = require('nodemailer');

const sendEmail = async ({ to, subject, html, text }) => {
  let transporter;

  console.log(`[Email Debug] Starting sendEmail process...`);
  console.log(`[Email Debug] To: ${to}`);
  console.log(`[Email Debug] Using User: ${process.env.SMTP_USER}`);

  if (process.env.SMTP_SERVICE === 'gmail' || (process.env.SMTP_HOST && process.env.SMTP_HOST.includes('gmail'))) {
    console.log('[Email Debug] Config: Gmail (Port 465, Secure)');
    transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      tls: {
        rejectUnauthorized: false
      }
    });
  } else if (process.env.SMTP_HOST) {
    console.log(`[Email Debug] Config: Generic SMTP (${process.env.SMTP_HOST}:${process.env.SMTP_PORT || 587})`);
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
    console.error('[Email Error] CRITICAL: SMTP is not configured in production!');
    return;
  } else {
    console.log('[Email Debug] Config: Ethereal Fallback');
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

  // Verify connection configuration
  try {
    console.log('[Email Debug] Verifying SMTP connection...');
    await transporter.verify();
    console.log('[Email Debug] SMTP Connection verified successfully.');
  } catch (verifyError) {
    console.error('[Email Error] SMTP Connection Verification Failed!');
    console.error('[Reason]', verifyError.message);
    // Don't return here, attempt to send anyway but we'll know where it failed
  }

  const mailOptions = {
    from: process.env.FROM_EMAIL || `"Git Guardian" <${process.env.SMTP_USER}>`,
    to,
    subject,
    html,
    text: text || 'Please verify your account.',
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`[Email] Success! Mail sent to ${to}. ID: ${info.messageId}`);
  } catch (error) {
    console.error('-----------------------------------------');
    console.error('[Email Error] Failed to send email.');
    console.error('[Code]', error.code);
    console.error('[Reason]', error.message);
    if (error.message.includes('Invalid login') || error.code === 'EAUTH') {
      console.error('[Action Required] Your Gmail App Password is likely incorrect.');
    }
    console.error('-----------------------------------------');
  }
};

module.exports = sendEmail;
