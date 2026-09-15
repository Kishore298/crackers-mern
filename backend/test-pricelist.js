require("dotenv").config();
const fs = require("fs");
const path = require("path");
const whatsapp = require("./config/whatsappService");

async function testPricelist() {
  try {
    const pdfPath = path.join(__dirname, "..", "user-frontend", "public", "price-list.pdf");
    console.log(`Uploading PDF from: ${pdfPath}`);
    
    if (!fs.existsSync(pdfPath)) {
      throw new Error(`PDF not found at ${pdfPath}`);
    }

    const pdfBuffer = fs.readFileSync(pdfPath);
    console.log("Uploading media to WhatsApp...");
    const mediaId = await whatsapp.uploadMedia(pdfBuffer, "price-list.pdf", "application/pdf");
    
    console.log(`Uploaded! Media ID: ${mediaId}`);
    console.log("Sending template 'diwali_pricelist_2026' to 919344146133...");

    const response = await whatsapp.sendDocumentTemplate("919344146133", {
      mediaId,
      filename: "V-Crackers-Pricelist.pdf",
      templateName: "diwali_pricelist_2026",
      language: "en",
      couponCode: "DIWALI26"
    });

    console.log("✅ Success! API Response:");
    console.log(JSON.stringify(response, null, 2));
  } catch (error) {
    console.error("❌ Error:");
    console.error(error.response?.data || error.message);
  }
}

testPricelist();
