const PDFDocument = require("pdfkit");
const path = require("path");
const fs = require("fs");

/**
 * Generate an e-receipt PDF for an order and return it as a Buffer.
 * @param {Object} sale - The sale/order document (populated)
 * @param {Object} customer - { name, email, phone }
 * @returns {Promise<Buffer>}
 */
const generateReceiptPDF = (sale, customer) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 50 });
    const chunks = [];

    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const primaryColor = "#8b0000";
    const orange = "#ff6600";
    const gray = "#555555";
    const lightGray = "#999999";

    // ─── Logo & Header ───
    const logoPath = path.join(
      __dirname,
      "..",
      "public",
      "v-crackers-logo.png",
    );
    if (fs.existsSync(logoPath)) {
      doc.image(logoPath, 50, 40, { width: 80 });
    }

    doc
      .font("Helvetica-Bold")
      .fontSize(22)
      .fillColor(primaryColor)
      .text("V Crackers", 140, 50);

    doc
      .font("Helvetica")
      .fontSize(9)
      .fillColor(lightGray)
      .text("Light Up Your Celebrations!", 140, 75);

    // Company details
    doc
      .fontSize(8)
      .fillColor(gray)
      .text("Sivakasi, Tamil Nadu, India", 350, 50, { align: "right" })
      .text("Phone: +91 98765 43210", 350, 62, { align: "right" })
      .text("Email: info@vcrackers.com", 350, 74, { align: "right" })
      .text("GSTIN: 33XXXXX1234X1ZX", 350, 86, { align: "right" });

    // Divider
    doc
      .moveTo(50, 110)
      .lineTo(545, 110)
      .strokeColor(orange)
      .lineWidth(2)
      .stroke();

    // ─── Invoice Details ───
    let y = 125;
    doc
      .font("Helvetica-Bold")
      .fontSize(16)
      .fillColor(primaryColor)
      .text("ORDER RECEIPT", 50, y);

    y += 28;
    doc.font("Helvetica").fontSize(10).fillColor(gray);
    doc.text(`Invoice No: ${sale.invoiceNo}`, 50, y);
    doc.text(
      `Date: ${new Date(sale.createdAt).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })}`,
      350,
      y,
      { align: "right" },
    );

    y += 18;
    doc.text(`Customer: ${customer.name || "N/A"}`, 50, y);
    doc.text(`Payment: Online (Razorpay)`, 350, y, { align: "right" });

    y += 15;
    doc.text(`Email: ${customer.email || "N/A"}`, 50, y);
    if (customer.phone) {
      doc.text(`Phone: ${customer.phone}`, 350, y, { align: "right" });
    }

    // Shipping address
    if (sale.shippingAddress) {
      y += 15;
      const addr = sale.shippingAddress;
      const addressStr = [
        addr.fullName,
        addr.addressLine1,
        addr.addressLine2,
        `${addr.city || ""}, ${addr.state || ""} - ${addr.pincode || ""}`,
      ]
        .filter(Boolean)
        .join(", ");
      doc.text(`Ship To: ${addressStr}`, 50, y, { width: 495 });
      y += doc.heightOfString(`Ship To: ${addressStr}`, { width: 495 });
    }

    // ─── Items Table ───
    y += 20;

    // Table header
    doc.rect(50, y, 495, 24).fill(primaryColor);

    doc.font("Helvetica-Bold").fontSize(9).fillColor("#ffffff");

    doc.text("#", 58, y + 7, { width: 25 });
    doc.text("Product", 85, y + 7, { width: 220 });
    doc.text("Qty", 310, y + 7, { width: 45, align: "center" });
    doc.text("Price", 360, y + 7, { width: 80, align: "right" });
    doc.text("Subtotal", 445, y + 7, { width: 90, align: "right" });

    y += 24;

    // Table rows
    doc.font("Helvetica").fontSize(9).fillColor(gray);
    sale.items.forEach((item, i) => {
      const rowBg = i % 2 === 0 ? "#FAFAFA" : "#FFFFFF";
      doc.rect(50, y, 495, 22).fill(rowBg);

      doc.fillColor(gray);
      doc.text(`${i + 1}`, 58, y + 6, { width: 25 });
      doc.text(item.name, 85, y + 6, { width: 220 });
      doc.text(`${item.quantity}`, 310, y + 6, { width: 45, align: "center" });
      doc.text(`₹${item.price.toLocaleString("en-IN")}`, 360, y + 6, {
        width: 80,
        align: "right",
      });
      doc.text(`₹${item.subtotal.toLocaleString("en-IN")}`, 445, y + 6, {
        width: 90,
        align: "right",
      });
      y += 22;
    });

    // Divider
    doc
      .moveTo(50, y)
      .lineTo(545, y)
      .strokeColor("#e0e0e0")
      .lineWidth(1)
      .stroke();

    // ─── Totals ───
    y += 12;
    doc.font("Helvetica").fontSize(10).fillColor(gray);
    doc.text("Subtotal:", 360, y, { width: 80, align: "right" });
    doc.text(`₹${(sale.totalAmount || 0).toLocaleString("en-IN")}`, 445, y, {
      width: 90,
      align: "right",
    });

    if (sale.discount > 0) {
      y += 18;
      doc.fillColor("#10B981");
      doc.text("Discount:", 360, y, { width: 80, align: "right" });
      doc.text(`- ₹${(sale.discount || 0).toLocaleString("en-IN")}`, 445, y, {
        width: 90,
        align: "right",
      });
    }

    y += 22;
    doc
      .moveTo(360, y)
      .lineTo(545, y)
      .strokeColor(orange)
      .lineWidth(1.5)
      .stroke();

    y += 8;
    doc.font("Helvetica-Bold").fontSize(13).fillColor(primaryColor);
    doc.text("Total Paid:", 340, y, { width: 100, align: "right" });
    doc.text(`₹${(sale.finalPayable || 0).toLocaleString("en-IN")}`, 445, y, {
      width: 90,
      align: "right",
    });

    // ─── Footer ───
    y += 45;
    doc
      .moveTo(50, y)
      .lineTo(545, y)
      .strokeColor("#e0e0e0")
      .lineWidth(0.5)
      .stroke();

    y += 12;
    doc
      .font("Helvetica")
      .fontSize(8)
      .fillColor(lightGray)
      .text("Thank you for shopping with V Crackers! 🎆", 50, y, {
        align: "center",
        width: 495,
      });

    y += 14;
    doc.text(
      "This is a computer-generated receipt and does not require a signature.",
      50,
      y,
      { align: "center", width: 495 },
    );

    doc.end();
  });
};

module.exports = { generateReceiptPDF };
