const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

/**
 * Send OTP email to user
 * @param {string} to - Recipient email
 * @param {string} otp - 6-digit OTP
 */
const sendOtpEmail = async (to, otp) => {
  const mailOptions = {
    from: `"V Crackers" <${process.env.FROM_EMAIL || process.env.SMTP_USER}>`,
    to,
    subject: "🎆 Password Reset OTP – V Crackers",
    html: `
      <div style="font-family: 'Segoe UI', sans-serif; max-width: 520px; margin: 0 auto; background: #fff; border-radius: 16px; overflow: hidden; border: 1px solid #FFE4D0;">
        <!-- Header -->
        <div style="background: linear-gradient(140deg, #8b0000, #ff6600, #ffcc33); padding: 32px 24px; text-align: center;">
          <h1 style="color: #fff; margin: 0; font-size: 26px; letter-spacing: 1px;">🎆 V Crackers</h1>
          <p style="color: rgba(255,255,255,0.85); margin: 6px 0 0; font-size: 14px;">Password Reset</p>
        </div>
        <!-- Body -->
        <div style="padding: 32px 24px;">
          <p style="color: #333; font-size: 15px; margin: 0 0 16px;">Hi there! You requested a password reset. Use the OTP below:</p>
          <div style="background: #FFF8F5; border: 2px dashed #ff6600; border-radius: 12px; padding: 24px; text-align: center; margin: 20px 0;">
            <p style="color: #666; font-size: 13px; margin: 0 0 8px; text-transform: uppercase; letter-spacing: 1px;">Your OTP Code</p>
            <h2 style="color: #8b0000; font-size: 42px; letter-spacing: 12px; margin: 0; font-weight: 900;">${otp}</h2>
          </div>
          <p style="color: #555; font-size: 13px; margin: 16px 0 0;">⏰ This OTP is valid for <strong>10 minutes</strong>.</p>
          <p style="color: #999; font-size: 12px; margin: 8px 0 0;">If you didn't request this, you can safely ignore this email.</p>
        </div>
        <!-- Footer -->
        <div style="background: #FFF0E8; padding: 16px 24px; text-align: center; border-top: 1px solid #FFE4D0;">
          <p style="color: #ff6600; font-size: 12px; margin: 0; font-weight: 600;">© 2026 V Crackers – Light Up Your Celebrations! 🎇</p>
        </div>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};

module.exports = { sendOtpEmail };
