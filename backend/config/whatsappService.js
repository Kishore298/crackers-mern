const axios = require("axios");
const FormData = require("form-data");

/**
 * WhatsApp Cloud API Service
 *
 * Template Categories:
 *  - AUTHENTICATION : sendOTP
 *  - UTILITY        : sendOrderConfirmation, sendOrderReceipt (+ PDF),
 *                     sendOrderStatusUpdate, sendCODPaymentLink
 *
 * All template names are environment-variable driven so you can
 * swap them to match your approved Meta Business Manager templates.
 */
class WhatsAppService {
  constructor() {
    this.phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    this.token = process.env.WHATSAPP_ACCESS_TOKEN;
    this.version = process.env.WHATSAPP_API_VERSION || "v21.0";
    this.baseUrl = `https://graph.facebook.com/${this.version}/${this.phoneId}/messages`;
    this.mediaUrl = `https://graph.facebook.com/${this.version}/${this.phoneId}/media`;
  }

  /** Guard – returns true only when real credentials are present */
  get isConfigured() {
    return !!(
      this.phoneId &&
      this.token &&
      this.phoneId !== "123456789012345" &&
      !this.token.includes("xxxxxxxxxx")
    );
  }

  // ─────────────────────────────────────────────────────────────────
  // CORE HELPERS
  // ─────────────────────────────────────────────────────────────────

  /**
   * Upload a Buffer (PDF, image, …) to the WhatsApp Media API.
   * Returns the media_id string, or null on failure.
   */
  async uploadMedia(buffer, filename = "receipt.pdf", mimeType = "application/pdf") {
    if (!this.isConfigured) {
      console.warn("[WhatsApp] Credentials not configured – skipping media upload.");
      return null;
    }

    try {
      const form = new FormData();
      form.append("file", buffer, { filename, contentType: mimeType });
      form.append("messaging_product", "whatsapp");
      form.append("type", mimeType);

      const response = await axios.post(this.mediaUrl, form, {
        headers: {
          Authorization: `Bearer ${this.token}`,
          ...form.getHeaders(),
        },
      });

      const mediaId = response.data?.id;
      console.log(`[WhatsApp] Media uploaded – id: ${mediaId}`);
      return mediaId;
    } catch (error) {
      console.error(
        "[WhatsApp] Media upload error:",
        error.response?.data || error.message
      );
      return null;
    }
  }

  /**
   * Low-level: send a WhatsApp template message.
   * @param {string}   to           – E.164 phone (with or without leading +)
   * @param {string}   templateName – approved template name in Meta dashboard
   * @param {Array}    components   – header / body / button component array
   * @param {string}   language     – BCP-47 language code (default en_US)
   */
  async sendTemplate(to, templateName, components = [], language = "en_US") {
    if (!this.isConfigured) {
      console.warn(
        `[WhatsApp] Credentials not configured – skipping template '${templateName}'.`
      );
      return null;
    }

    const phone = to.startsWith("+") ? to.substring(1) : to;

    const payload = {
      messaging_product: "whatsapp",
      to: phone,
      type: "template",
      template: {
        name: templateName,
        language: { code: language },
        components,
      },
    };

    try {
      const response = await axios.post(this.baseUrl, payload, {
        headers: {
          Authorization: `Bearer ${this.token}`,
          "Content-Type": "application/json",
        },
      });
      console.log(`[WhatsApp] ✓ Template '${templateName}' → ${phone}`);
      return response.data;
    } catch (error) {
      console.error(
        `[WhatsApp] ✗ Template '${templateName}' error:`,
        error.response?.data || error.message
      );
      throw error;
    }
  }

  // ─────────────────────────────────────────────────────────────────
  // AUTHENTICATION  –  OTP
  // ─────────────────────────────────────────────────────────────────

  /**
   * Send OTP via WhatsApp.
   * Meta template category: AUTHENTICATION
   *
   * Expected template body:  "Your {{1}} OTP is *{{1}}*. Valid for 5 minutes."
   * Expected button (index 0, sub_type url): dynamic suffix = OTP so
   *   the user can tap to deep-link into the app.
   *
   * Body params   → [otp]
   * Button params → [otp]  (the dynamic part of the CTA URL)
   */
  async sendOTP(phone, otp) {
    const templateName =
      process.env.WHATSAPP_OTP_TEMPLATE_NAME || "otp_verification";

    const components = [
      {
        type: "body",
        parameters: [{ type: "text", text: otp }],
      },
      {
        type: "button",
        sub_type: "url",
        index: "0",
        parameters: [{ type: "text", text: otp }],
      },
    ];

    return this.sendTemplate(phone, templateName, components);
  }

  // ─────────────────────────────────────────────────────────────────
  // UTILITY  –  Order Confirmation (text only)
  // ─────────────────────────────────────────────────────────────────

  /**
   * Send order-placed confirmation (no PDF attachment).
   * Meta template category: UTILITY
   *
   * Body params → [name, orderId, amount, trackingLink]
   */
  async sendOrderConfirmation(phone, { name, orderId, amount, trackingLink }) {
    const templateName =
      process.env.WHATSAPP_ORDER_TEMPLATE_NAME || "order_confirmation";

    const components = [
      {
        type: "body",
        parameters: [
          { type: "text", text: name },
          { type: "text", text: orderId },
          { type: "text", text: `Rs.${amount}` },
          { type: "text", text: trackingLink },
        ],
      },
    ];

    return this.sendTemplate(phone, templateName, components);
  }

  // ─────────────────────────────────────────────────────────────────
  // UTILITY  –  Order Receipt (Document / PDF)
  // ─────────────────────────────────────────────────────────────────

  /**
   * Upload a PDF buffer and then send it as a WhatsApp template message
   * with a DOCUMENT header.
   *
   * Meta template category: UTILITY
   * Template header type  : DOCUMENT
   *
   * Body params → [name, orderId, amount, trackingLink]
   *
   * @param {string} phone   – recipient
   * @param {Object} opts
   * @param {string} opts.name       – customer name
   * @param {string} opts.orderId    – invoice / order number
   * @param {number|string} opts.amount – order amount
   * @param {string} opts.trackingLink – link to track order
   * @param {Buffer} opts.pdfBuffer  – raw PDF bytes
   * @param {string} [opts.filename] – filename shown in chat
   */
  async sendOrderReceipt(phone, { name, orderId, amount, trackingLink, pdfBuffer, filename }) {
    const pdfFilename = filename || `Receipt-${orderId}.pdf`;

    // 1. Upload PDF
    const mediaId = await this.uploadMedia(pdfBuffer, pdfFilename, "application/pdf");
    if (!mediaId) {
      console.warn("[WhatsApp] PDF upload failed – skipping receipt send.");
      return null;
    }

    const templateName =
      process.env.WHATSAPP_RECEIPT_TEMPLATE_NAME || "order_receipt";

    const components = [
      {
        type: "header",
        parameters: [
          {
            type: "document",
            document: {
              id: mediaId,
              filename: pdfFilename,
            },
          },
        ],
      },
      {
        type: "body",
        parameters: [
          { type: "text", text: name },
          { type: "text", text: orderId },
          { type: "text", text: `Rs.${amount}` },
          { type: "text", text: trackingLink },
        ],
      },
    ];

    return this.sendTemplate(phone, templateName, components);
  }

  // ─────────────────────────────────────────────────────────────────
  // UTILITY  –  Order Status Update
  // ─────────────────────────────────────────────────────────────────

  /**
   * Notify customer of order status change.
   * Meta template category: UTILITY
   *
   * Body params → [name, orderId, statusLabel, trackingLink]
   */
  async sendOrderStatusUpdate(phone, { name, orderId, status, trackingLink }) {
    const templateName =
      process.env.WHATSAPP_STATUS_TEMPLATE_NAME || "order_status_update";

    // Human-readable labels
    const statusLabels = {
      processing: "Being Prepared",
      packed: "Packed & Ready",
      shipped: "Out for Delivery",
      delivered: "Delivered",
      cancelled: "Cancelled",
    };
    const statusLabel = statusLabels[status] || status;

    const components = [
      {
        type: "body",
        parameters: [
          { type: "text", text: name },
          { type: "text", text: orderId },
          { type: "text", text: statusLabel },
          { type: "text", text: trackingLink },
        ],
      },
    ];

    return this.sendTemplate(phone, templateName, components);
  }

  // ─────────────────────────────────────────────────────────────────
  // UTILITY  –  COD Payment Link
  // ─────────────────────────────────────────────────────────────────

  /**
   * Send a Razorpay Payment Link to a COD customer via WhatsApp.
   * Meta template category: UTILITY
   * Template must have a Call-To-Action (CTA) URL button at index 0.
   *
   * The template button's base URL should be set to "https://rzp.io/"
   * in Meta Business Manager; we pass the dynamic slug (the part after
   * the slash) as the button parameter.
   *
   * Body params   → [name, orderId, amount]
   * Button params → [paymentLinkSlug]
   */


  // async sendCODPaymentLink(phone, { name, orderId, amount, paymentLink }) {
  //   const templateName =
  //     process.env.WHATSAPP_PAYMENT_LINK_TEMPLATE_NAME || "cod_payment_link";

  //   // Extract dynamic slug from Razorpay short URL
  //   // e.g. https://rzp.io/rzp/AbCd1234 → "rzp/AbCd1234"
  //   const slugMatch = paymentLink.match(/rzp\.io\/(.+)$/);
  //   const linkSlug = slugMatch ? slugMatch[1] : paymentLink;

  //   const components = [
  //     {
  //       type: "body",
  //       parameters: [
  //         { type: "text", text: name },
  //         { type: "text", text: orderId },
  //         { type: "text", text: `Rs.${amount}` },
  //       ],
  //     },
  //     {
  //       type: "button",
  //       sub_type: "url",
  //       index: "0",
  //       parameters: [{ type: "text", text: linkSlug }],
  //     },
  //   ];

  //   return this.sendTemplate(phone, templateName, components);
  // }

  // ─────────────────────────────────────────────────────────────────
  // UTILITY  –  Admin New Order Notification
  // ─────────────────────────────────────────────────────────────────

  /**
   * Notify admin of a new order.
   * Meta template category: UTILITY
   *
   * Body params → [customerName, orderId, amount, adminLink]
   */
  async sendAdminOrderNotification(phone, { customerName, orderId, amount, adminLink }) {
    const templateName =
      process.env.WHATSAPP_ADMIN_ORDER_TEMPLATE_NAME || "admin_new_order";

    const components = [
      {
        type: "body",
        parameters: [
          { type: "text", text: customerName },
          { type: "text", text: orderId },
          { type: "text", text: `Rs.${amount}` },
          { type: "text", text: adminLink },
        ],
      },
    ];

    return this.sendTemplate(phone, templateName, components);
  }

  // ─────────────────────────────────────────────────────────────────
  // BACKWARD-COMPATIBILITY ALIASES
  // ─────────────────────────────────────────────────────────────────

  /** @deprecated Use sendOrderConfirmation */
  async sendOrderNotification(phone, { name, orderId, amount, trackingLink }) {
    return this.sendOrderConfirmation(phone, { name, orderId, amount, trackingLink });
  }

  /** @deprecated Use sendTemplate directly */
  async sendMessage(to, templateName, components = [], language = "en_US") {
    return this.sendTemplate(to, templateName, components, language);
  }
}

module.exports = new WhatsAppService();
