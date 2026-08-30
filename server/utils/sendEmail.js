import nodemailer from 'nodemailer';

/**
 * Creates and returns a Nodemailer transporter instance
 */
const createTransporter = () => {
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = parseInt(process.env.SMTP_PORT || '465', 10);
  const secure = process.env.SMTP_SECURE === 'true' || port === 465;
  const user = process.env.SMTP_USER?.trim();
  // Strip spaces if user provided spaced 16-char Gmail App Password
  const rawPass = process.env.SMTP_PASS || '';
  const pass = rawPass.replace(/\s+/g, '');

  if (!user || !pass) {
    return null;
  }

  // If using Gmail, standard transporter config
  if (host.includes('gmail.com')) {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user,
        pass,
      },
    });
  }

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user,
      pass,
    },
  });
};

/**
 * Generate branded HTML email content for OTP verification
 */
const getOtpEmailTemplate = (name, otp, title, actionText) => {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body {
      font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      margin: 0;
      padding: 0;
      background-color: #f4f8fa;
      color: #334155;
    }
    .wrapper {
      max-width: 560px;
      margin: 30px auto;
      background: #ffffff;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
      border: 1px solid #e2e8f0;
    }
    .header {
      background: #0B1E29;
      padding: 30px 40px;
      text-align: center;
    }
    .brand {
      color: #ffffff;
      font-size: 24px;
      font-weight: 700;
      letter-spacing: -0.5px;
      display: inline-flex;
      align-items: center;
      gap: 8px;
    }
    .brand-leaf {
      color: #22c55e;
    }
    .content {
      padding: 40px;
    }
    h1 {
      font-family: Georgia, 'Playfair Display', serif;
      font-size: 24px;
      color: #0f172a;
      margin-top: 0;
      margin-bottom: 16px;
    }
    p {
      font-size: 15px;
      line-height: 1.6;
      color: #475569;
      margin: 0 0 20px;
    }
    .otp-card {
      background: #f0fdf4;
      border: 2px dashed #86efac;
      border-radius: 12px;
      padding: 24px;
      text-align: center;
      margin: 28px 0;
    }
    .otp-code {
      font-size: 38px;
      font-weight: 800;
      letter-spacing: 8px;
      color: #15803d;
      font-family: 'Courier New', monospace;
      margin: 0;
    }
    .otp-sub {
      font-size: 13px;
      color: #166534;
      margin-top: 8px;
      font-weight: 500;
    }
    .warning-box {
      background: #fffbeb;
      border-left: 4px solid #f59e0b;
      padding: 12px 16px;
      border-radius: 6px;
      font-size: 13px;
      color: #92400e;
      margin-bottom: 24px;
    }
    .footer {
      background: #f8fafc;
      padding: 24px 40px;
      text-align: center;
      border-top: 1px solid #e2e8f0;
      font-size: 12px;
      color: #94a3b8;
    }
    .footer a {
      color: #16a34a;
      text-decoration: none;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <div class="brand">
        <span class="brand-leaf">🌿</span> NutriCraft
      </div>
    </div>
    <div class="content">
      <h1>${title}</h1>
      <p>Hello <strong>${name || 'Valued Member'}</strong>,</p>
      <p>${actionText}</p>
      
      <div class="otp-card">
        <div class="otp-code">${otp}</div>
        <div class="otp-sub">⏱️ This code will expire in <strong>10 minutes</strong>.</div>
      </div>

      <div class="warning-box">
        <strong>Security Notice:</strong> Never share this code with anyone. NutriCraft staff will never ask for your verification code.
      </div>

      <p style="font-size: 13px; color: #64748b;">
        If you didn't request this verification code, you can safely ignore this email.
      </p>
    </div>
    <div class="footer">
      &copy; ${new Date().getFullYear()} NutriCraft Dietitian & Wellness. All rights reserved.<br>
      Empowering healthier choices through science-backed nutrition.
    </div>
  </div>
</body>
</html>
`;
};

/**
 * Send an email with OTP verification code
 * @param {Object} options
 * @param {string} options.to - Recipient email
 * @param {string} options.name - Recipient name
 * @param {string} options.otp - 6-digit OTP code
 * @param {string} options.type - 'signup' | 'forgot-password' | 'resend'
 */
export async function sendOtpEmail({ to, name, otp, type = 'signup' }) {
  const from = process.env.SMTP_FROM || `"NutriCraft" <${process.env.SMTP_USER || 'noreply@nutricraft.com'}>`;
  
  let subject = 'Verify Your NutriCraft Account';
  let title = 'Verify Your Email Address';
  let actionText = 'Thank you for signing up with NutriCraft. Please use the verification code below to activate your account and access your nutrition portal:';

  if (type === 'forgot-password') {
    subject = 'NutriCraft - Password Reset Code';
    title = 'Reset Your Password';
    actionText = 'We received a request to reset your password. Use the verification code below to set a new password for your account:';
  } else if (type === 'resend') {
    subject = 'NutriCraft - New Verification Code';
    title = 'Your New Verification Code';
    actionText = 'Here is your newly requested verification code. Enter this code to proceed:';
  }

  const html = getOtpEmailTemplate(name, otp, title, actionText);
  const transporter = createTransporter();

  // If no SMTP configured, log cleanly in development console
  if (!transporter) {
    console.log('\n==================================================');
    console.log(`✉️  [DEV EMAIL SIMULATION]`);
    console.log(`To: ${to} (${name || 'User'})`);
    console.log(`Subject: ${subject}`);
    console.log(`🔑 OTP CODE: >>>  ${otp}  <<< (Expires in 10 mins)`);
    console.log(`Type: ${type}`);
    console.log(`Tip: Configure SMTP_USER and SMTP_PASS in .env for live emails.`);
    console.log('==================================================\n');
    return {
      success: true,
      simulated: true,
      message: 'OTP logged to server console (SMTP not configured in .env)',
    };
  }

  try {
    const info = await transporter.sendMail({
      from,
      to,
      subject,
      html,
    });
    console.log(`[EMAIL SUCCESS] OTP email sent to ${to}: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`[EMAIL ERROR] Failed to send email to ${to}:`, error.message);
    // Still log the OTP in console during development so testing isn't blocked
    console.log(`🔑 [FALLBACK DEV OTP]: >>> ${otp} <<<`);
    return { success: false, error: error.message };
  }
}

export default sendOtpEmail;
