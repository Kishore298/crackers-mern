const WhatsAppMessage = require("../models/WhatsAppMessage");
const { getIO } = require("../config/socket");

// @desc    Verify webhook subscription from Meta
// @route   GET /webhook
const verifyWebhook = (req, res) => {
  const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN;

  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    console.log("✅ WhatsApp Webhook verified successfully");
    // Important: send the challenge as a plain string, not JSON
    return res.status(200).send(challenge);
  }

  console.error("❌ Webhook verification failed. Token mismatch.");
  return res.sendStatus(403);
};

// @desc    Handle incoming messages and status updates
// @route   POST /webhook
const receiveMessage = async (req, res) => {
  try {
    const { body } = req;

    // Check if this is a WhatsApp status update or message
    if (body.object === "whatsapp_business_account") {
      for (const entry of body.entry) {
        for (const change of entry.changes) {
          if (change.value.messages) {
            // It's an incoming message
            const messageObj = change.value.messages[0];
            const contactObj = change.value.contacts?.[0];

            const messageId = messageObj.id;
            const from = messageObj.from;
            const customerName = contactObj?.profile?.name || "Unknown Customer";
            
            let messageText = "";
            let type = messageObj.type;

            if (type === "text") {
              messageText = messageObj.text.body;
            } else if (type === "button") {
              messageText = messageObj.button.text;
            } else if (type === "interactive") {
              messageText =
                messageObj.interactive.list_reply?.title ||
                messageObj.interactive.button_reply?.title ||
                "Interactive Response";
            } else {
              messageText = `[Received a ${type} message]`;
            }

            // Check if message already exists (prevent duplicate processing)
            const existingMessage = await WhatsAppMessage.findOne({ messageId });
            
            if (!existingMessage) {
              const newMessage = await WhatsAppMessage.create({
                from,
                customerName,
                body: messageText,
                messageId,
                type,
                status: "received",
                rawPayload: change.value,
              });

              console.log(`📩 New WhatsApp message from ${customerName} (${from}): ${messageText}`);

              // Emit to admin clients via Socket.IO
              try {
                const io = getIO();
                io.to("admin").emit("new_whatsapp_message", newMessage);
              } catch (ioErr) {
                console.error("Socket error on whatsapp emit:", ioErr.message);
              }
            }
          } else if (change.value.statuses) {
            // It's a delivery or read status update
            const statusObj = change.value.statuses[0];
            const messageId = statusObj.id;
            const status = statusObj.status; // 'delivered', 'read', 'sent', 'failed'

            await WhatsAppMessage.findOneAndUpdate(
              { messageId },
              { status },
              { new: true }
            );
            
            // Optionally emit status update to admin
            try {
              const io = getIO();
              io.to("admin").emit("whatsapp_message_status", { messageId, status });
            } catch (ioErr) {
              // Ignore if socket not ready
            }
          }
        }
      }
      return res.sendStatus(200);
    }

    // Return 404 if not from WhatsApp API
    return res.sendStatus(404);
  } catch (err) {
    console.error("Error processing WhatsApp Webhook:", err);
    return res.sendStatus(500);
  }
};

module.exports = {
  verifyWebhook,
  receiveMessage,
};
