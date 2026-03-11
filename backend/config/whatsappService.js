const axios = require("axios");

/**
 * WhatsApp Cloud API Service
 */
class WhatsAppService {
  constructor() {
    this.phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    this.token = process.env.WHATSAPP_ACCESS_TOKEN;
    this.version = process.env.WHATSAPP_API_VERSION || "v21.0";
    this.baseUrl = `https://graph.facebook.com/${this.version}/${this.phoneId}/messages`;
  }

  async sendMessage(to, templateName, components = [], language = "en") {
    if (!this.phoneId || !this.token) {
      console.warn("WhatsApp credentials missing. Skipping message.");
      return null;
    }

    try {
      const payload = {
        messaging_product: "whatsapp",
        to: to.startsWith("+") ? to.substring(1) : to, // Remove + if present
        type: "template",
        template: {
          name: templateName,
          language: { code: language },
          components: components,
        },
      };

      const response = await axios.post(this.baseUrl, payload, {
        headers: {
          Authorization: `Bearer ${this.token}`,
          "Content-Type": "application/json",
        },
      });

      return response.data;
    } catch (error) {
      console.error(
        "WhatsApp API Error:",
        error.response ? error.response.data : error.message
      );
      throw error;
    }
  }

  /**
   * Send OTP via WhatsApp
   * @param {string} phone - Recipient phone number
   * @param {string} otp - 6-digit OTP
   */
  async sendOTP(phone, otp) {
    const templateName = process.env.WHATSAPP_OTP_TEMPLATE_NAME || "otp_verification";
    const components = [
      {
        type: "body",
        parameters: [
          { type: "text", text: process.env.APP_NAME || "V Crackers" },
          { type: "text", text: otp },
        ],
      },
      {
        type: "button",
        sub_type: "url",
        index: "0",
        parameters: [{ type: "text", text: otp }],
      },
    ];

    return this.sendMessage(phone, templateName, components);
  }

  /**
   * Send Order Notification via WhatsApp
   * @param {string} phone - Recipient phone number
   * @param {Object} order - Order details { name, orderId, amount, trackingLink }
   */
  async sendOrderNotification(phone, { name, orderId, amount, trackingLink }) {
    const templateName = process.env.WHATSAPP_ORDER_TEMPLATE_NAME || "order_confirmation";
    const components = [
      {
        type: "body",
        parameters: [
          { type: "text", text: name },
          { type: "text", text: orderId },
          { type: "text", text: amount.toString() },
          { type: "text", text: trackingLink },
        ],
      },
    ];

    return this.sendMessage(phone, templateName, components);
  }
}

module.exports = new WhatsAppService();
