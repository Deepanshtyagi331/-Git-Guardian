const nodemailer = require('nodemailer');

const sendEmail = async ({ to, subject, html, text }) => {
  let transporter;

  console.log(`[Email Debug] Starting sendEmail process...`);
  console.log(`[Email Debug] To: ${to}`);
  console.log(`[Email Debug] Using SMTP_USER: ${process.env.SMTP_USER}`);

  // Use manual config for Gmail to avoid Render connection timeouts
  if (process.env.SMTP_SERVICE === 'gmail' || (process.env.SMTP_HOST && process.env.SMTP_HOST.includes('gmail'))) {
    console.log('[Email Debug] Config: Gmail Manual (Port 587, STARTTLS)');
    transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false, // Use STARTTLS
      family: 4,     // Force IPv4 to avoid ENETUNREACH issues on Render
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      tls: {
        rejectUnauthorized: false,
        ciphers: 'SSLv3'
      },
      connectionTimeout: 20000,
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

  // Skipping explicit verification to avoid timeouts; sendMail will report issues

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
    return info;
  } catch (error) {
    console.error('-----------------------------------------');
    console.error('[Email Error] Failed to send email.');
    console.error('[Code]', error.code);
    console.error('[Response]', error.response);
    console.error('[Reason]', error.message);
    
    if (error.message.includes('Invalid login') || error.code === 'EAUTH') {
      console.error('[Action Required] Gmail App Password rejected. Check if 2FA is on and password is correct.');
    }
    console.error('-----------------------------------------');
    throw error; // Rethrow to let the controller know it failed
  }
};

module.exports = sendEmail;

