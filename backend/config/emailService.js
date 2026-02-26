const nodemailer = require("nodemailer");
const { generateReceiptPDF } = require("./pdfService");

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
 */
const sendOtpEmail = async (to, otp) => {
  const mailOptions = {
    from: `"V Crackers" <${process.env.FROM_EMAIL || process.env.SMTP_USER}>`,
    to,
    subject: "🎆 Password Reset OTP – V Crackers",
    html: `
      <div style="font-family: 'Segoe UI', sans-serif; max-width: 520px; margin: 0 auto; background: #fff; border-radius: 16px; overflow: hidden; border: 1px solid #FFE4D0;">
        <div style="background: linear-gradient(140deg, #8b0000, #ff6600, #ffcc33); padding: 32px 24px; text-align: center;">
          <h1 style="color: #fff; margin: 0; font-size: 26px; letter-spacing: 1px;">🎆 V Crackers</h1>
          <p style="color: rgba(255,255,255,0.85); margin: 6px 0 0; font-size: 14px;">Password Reset</p>
        </div>
        <div style="padding: 32px 24px;">
          <p style="color: #333; font-size: 15px; margin: 0 0 16px;">Hi there! You requested a password reset. Use the OTP below:</p>
          <div style="background: #FFF8F5; border: 2px dashed #ff6600; border-radius: 12px; padding: 24px; text-align: center; margin: 20px 0;">
            <p style="color: #666; font-size: 13px; margin: 0 0 8px; text-transform: uppercase; letter-spacing: 1px;">Your OTP Code</p>
            <h2 style="color: #8b0000; font-size: 42px; letter-spacing: 12px; margin: 0; font-weight: 900;">${otp}</h2>
          </div>
          <p style="color: #555; font-size: 13px; margin: 16px 0 0;">⏰ This OTP is valid for <strong>10 minutes</strong>.</p>
          <p style="color: #999; font-size: 12px; margin: 8px 0 0;">If you didn't request this, you can safely ignore this email.</p>
        </div>
        <div style="background: #FFF0E8; padding: 16px 24px; text-align: center; border-top: 1px solid #FFE4D0;">
          <p style="color: #ff6600; font-size: 12px; margin: 0; font-weight: 600;">© 2026 V Crackers – Light Up Your Celebrations! 🎇</p>
        </div>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};

/**
 * Send order confirmation email with PDF receipt attached.
 * @param {string} to - Customer email
 * @param {Object} sale - Sale document (with items, totals, etc.)
 * @param {Object} customer - { name, email, phone }
 */
const sendOrderConfirmationEmail = async (to, sale, customer) => {
  // Generate PDF buffer
  const pdfBuffer = await generateReceiptPDF(sale, customer);

  const itemRows = sale.items
    .map(
      (item) =>
        `<tr>
          <td style="padding: 10px 12px; border-bottom: 1px solid #f0f0f0; font-size: 13px; color: #333;">${item.name}</td>
          <td style="padding: 10px 12px; border-bottom: 1px solid #f0f0f0; text-align: center; font-size: 13px; color: #555;">${item.quantity}</td>
          <td style="padding: 10px 12px; border-bottom: 1px solid #f0f0f0; text-align: right; font-size: 13px; color: #555;">₹${item.price.toLocaleString("en-IN")}</td>
          <td style="padding: 10px 12px; border-bottom: 1px solid #f0f0f0; text-align: right; font-size: 13px; font-weight: 600; color: #333;">₹${item.subtotal.toLocaleString("en-IN")}</td>
        </tr>`,
    )
    .join("");

  const orderDate = new Date(sale.createdAt).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  const mailOptions = {
    from: `"V Crackers" <${process.env.FROM_EMAIL || process.env.SMTP_USER}>`,
    to,
    subject: `🎆 Order Confirmed – ${sale.invoiceNo} | V Crackers`,
    html: `
      <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; background: #fff; border-radius: 16px; overflow: hidden; border: 1px solid #FFE4D0;">
        <!-- Header -->
        <div style="background: linear-gradient(140deg, #8b0000, #ff6600, #ffcc33); padding: 32px 24px; text-align: center;">
          <h1 style="color: #fff; margin: 0; font-size: 26px;">🎆 V Crackers</h1>
          <p style="color: rgba(255,255,255,0.85); margin: 8px 0 0; font-size: 14px;">Order Confirmation</p>
        </div>

        <!-- Body -->
        <div style="padding: 28px 24px;">
          <p style="color: #333; font-size: 15px; margin: 0 0 6px;">Hi <strong>${customer.name || "Customer"}</strong>,</p>
          <p style="color: #555; font-size: 14px; margin: 0 0 20px;">Thank you for your order! Here are your details:</p>

          <!-- Order Meta -->
          <div style="background: #FFF8F5; border-radius: 12px; padding: 16px; margin-bottom: 20px;">
            <table style="width: 100%; font-size: 13px; color: #555;">
              <tr>
                <td><strong>Invoice:</strong> ${sale.invoiceNo}</td>
                <td style="text-align: right;"><strong>Date:</strong> ${orderDate}</td>
              </tr>
              <tr>
                <td><strong>Status:</strong> <span style="color: #10B981; font-weight: 600;">Paid ✓</span></td>
                <td style="text-align: right;"><strong>Items:</strong> ${sale.items.length}</td>
              </tr>
            </table>
          </div>

          <!-- Items Table -->
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            <thead>
              <tr style="background: #8b0000;">
                <th style="padding: 10px 12px; text-align: left; font-size: 12px; color: #fff; text-transform: uppercase;">Product</th>
                <th style="padding: 10px 12px; text-align: center; font-size: 12px; color: #fff; text-transform: uppercase;">Qty</th>
                <th style="padding: 10px 12px; text-align: right; font-size: 12px; color: #fff; text-transform: uppercase;">Price</th>
                <th style="padding: 10px 12px; text-align: right; font-size: 12px; color: #fff; text-transform: uppercase;">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              ${itemRows}
            </tbody>
          </table>

          <!-- Totals -->
          <div style="text-align: right; margin-bottom: 20px;">
            <p style="font-size: 13px; color: #555; margin: 4px 0;">Subtotal: <strong>₹${(sale.totalAmount || 0).toLocaleString("en-IN")}</strong></p>
            ${sale.discount > 0 ? `<p style="font-size: 13px; color: #10B981; margin: 4px 0;">Discount: <strong>-₹${(sale.discount || 0).toLocaleString("en-IN")}</strong></p>` : ""}
            <p style="font-size: 18px; color: #8b0000; font-weight: 900; margin: 8px 0 0;">Total: ₹${(sale.finalPayable || 0).toLocaleString("en-IN")}</p>
          </div>

          <p style="color: #999; font-size: 12px; text-align: center; margin: 0;">📎 A PDF receipt is attached to this email for your records.</p>
        </div>

        <!-- Footer -->
        <div style="background: #FFF0E8; padding: 16px 24px; text-align: center; border-top: 1px solid #FFE4D0;">
          <p style="color: #ff6600; font-size: 12px; margin: 0; font-weight: 600;">© 2026 V Crackers – Light Up Your Celebrations! 🎇</p>
        </div>
      </div>
    `,
    attachments: [
      {
        filename: `V-Crackers-Receipt-${sale.invoiceNo}.pdf`,
        content: pdfBuffer,
        contentType: "application/pdf",
      },
    ],
  };

  await transporter.sendMail(mailOptions);
};

module.exports = { sendOtpEmail, sendOrderConfirmationEmail };
