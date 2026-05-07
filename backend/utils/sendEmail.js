const nodemailer = require('nodemailer');
const dns = require('dns');

// Force Node.js to prefer IPv4 over IPv6 globally to avoid ENETUNREACH on Render
if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder('ipv4first');
}

const sendEmail = async ({ to, subject, html, text }) => {
  let transporter;

  console.log(`[Email Debug] Starting sendEmail process...`);
  console.log(`[Email Debug] To: ${to}`);
  console.log(`[Email Debug] Using SMTP_USER: ${process.env.SMTP_USER}`);

  if (process.env.SMTP_SERVICE === 'gmail' || (process.env.SMTP_USER && process.env.SMTP_USER.includes('gmail'))) {
    console.log('[Email Debug] Config: Gmail (Strict IPv4 Lookup, Port 587)');

    transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      // Surgical fix: Force DNS to only return IPv4 addresses
      lookup: (hostname, options, callback) => {
        dns.lookup(hostname, { family: 4 }, callback);
      },
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      tls: {
        rejectUnauthorized: false, // Bypass some network interference
        minVersion: 'TLSv1.2'
      },
      connectionTimeout: 30000, // 30 seconds
      greetingTimeout:   30000,
      socketTimeout:     30000,
    });




  } else if (process.env.SMTP_HOST) {
    console.log(`[Email Debug] Config: Generic SMTP (${process.env.SMTP_HOST}:${process.env.SMTP_PORT || 587})`);
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT || 587,
      secure: process.env.SMTP_PORT == 465,
      family: 4,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 10000,
    });

  } else if (process.env.NODE_ENV === 'production') {
    console.error('[Email Error] CRITICAL: SMTP is not configured in production!');
    return;

  } else {
    console.log('[Email Debug] Config: Ethereal Fallback (development only)');
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
    if (error.code === 'EAUTH' || error.message.includes('Invalid login')) {
      console.error('[Action Required] Gmail App Password rejected. Ensure 2FA is enabled and use a 16-char App Password.');
    }
    console.error('-----------------------------------------');
    throw error;
  }
};

module.exports = sendEmail;
