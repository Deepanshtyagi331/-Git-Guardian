const nodemailer = require('nodemailer');
const axios = require('axios');
const dns = require('dns');

// Force Node.js to prefer IPv4 over IPv6 globally to avoid ENETUNREACH on Render
if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder('ipv4first');
}

const sendEmail = async ({ to, subject, html, text }) => {
  // --- PRIORITIZE RESEND API (Option B) ---
  if (process.env.RESEND_API_KEY) {
    console.log('[Email Debug] Using Resend API (HTTPS Protocol)...');
    try {
      const response = await axios.post(
        'https://api.resend.com/emails',
        {
          // Note: If you haven't verified a domain on Resend, 
          // you MUST use "onboarding@resend.dev" as the sender.
          from: 'Git Guardian <onboarding@resend.dev>',
          to: [to],
          subject: subject,
          html: html,
        },
        {
          headers: {
            'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      );
      console.log(`[Email] Success via Resend! ID: ${response.data.id}`);
      return response.data;
    } catch (error) {
      console.error('[Email Error] Resend API failed, falling back to SMTP...', error.response?.data || error.message);
      // If Resend fails, we continue to the Nodemailer fallback below
    }
  }

  // --- FALLBACK TO NODEMAILER (Option A) ---
  let transporter;


  console.log(`[Email Debug] Starting sendEmail process...`);
  console.log(`[Email Debug] To: ${to}`);
  console.log(`[Email Debug] Using SMTP_USER: ${process.env.SMTP_USER}`);

  if (process.env.SMTP_SERVICE === 'gmail' || (process.env.SMTP_USER && process.env.SMTP_USER.includes('gmail'))) {
    console.log('[Email Debug] Config: Gmail (Strict IPv4 Lookup, Port 587)');

    transporter = nodemailer.createTransport({
      // Nuclear Option: Using a literal IPv4 address for Gmail SMTP
      // to bypass all DNS/IPv6 issues on Render.
      host: '74.125.136.108',
      port: 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      tls: {
        rejectUnauthorized: false,
        servername: 'smtp.gmail.com' // Still identify as gmail for the certificate
      },
      connectionTimeout: 30000,
      greetingTimeout: 30000,
      socketTimeout: 30000,
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
