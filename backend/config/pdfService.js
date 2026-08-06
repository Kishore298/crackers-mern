const PDFDocument = require("pdfkit");
const path = require("path");
const fs = require("fs");

/**
 * Generate an e-receipt PDF for an order and return it as a Buffer.
 * @param {Object} sale - The sale/order document (populated)
 * @param {Object} customer - { name, email, phone }
 * @returns {Promise<Buffer>}
 */
const generateReceiptPDF = async (sale, customer) => {
  // Pre-fetch images before building the PDF document
  const itemImages = [];
  for (const item of sale.items || []) {
    let imgBuf = null;
    try {
      if (item.product?.images?.[0]?.url) {
        const url = item.product.images[0].url.replace("/upload/", "/upload/w_100,q_auto/");
        const res = await fetch(url);
        if (res.ok) {
          const arrBuf = await res.arrayBuffer();
          imgBuf = Buffer.from(arrBuf);
        }
      }
    } catch (e) {
      console.error("Failed to fetch image for PDF:", e.message);
    }
    itemImages.push(imgBuf);
  }

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
      .fontSize(9)
      .fillColor(gray)
      .text("V Crackers, 4/468-G,", 350, 40, { align: "right" })
      .text("Sithalakshmi Nagar,", 350, 52, { align: "right" })
      .text("Kongalapuram, Sivakasi - 626123", 350, 64, { align: "right" })
      .text("+91 78249 07916, +91 87784 68360", 350, 76, { align: "right" })
      .text("vcrackerssivakasi@gmail.com", 350, 88, { align: "right" });

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
    const paymentLabel =
      sale.paymentMethod === "cash" || sale.paymentMethod === "cod"
        ? "Cash on Delivery"
        : sale.paymentMethod === "upi"
        ? "UPI"
        : "Online";
    doc.text(`Payment: ${paymentLabel}`, 350, y, { align: "right" });

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
    doc.text("Product", 125, y + 7, { width: 180 });
    doc.text("Qty", 310, y + 7, { width: 45, align: "center" });
    doc.text("Price", 360, y + 7, { width: 80, align: "right" });
    doc.text("Subtotal", 445, y + 7, { width: 90, align: "right" });

    y += 24;

    // Table rows
    doc.font("Helvetica").fontSize(9).fillColor(gray);
    sale.items.forEach((item, i) => {
      const rowHeight = 36;
      
      // Page break logic
      if (y + rowHeight > 780) {
        doc.addPage();
        y = 50;
        
        // Redraw headers on new page
        doc.font("Helvetica-Bold").fontSize(10).fillColor(primaryColor);
        doc.text("S.No", 50, y);
        doc.text("Item Details", 125, y);
        doc.text("Qty", 310, y, { width: 45, align: "center" });
        doc.text("Price", 360, y, { width: 80, align: "right" });
        doc.text("Subtotal", 445, y, { width: 90, align: "right" });
        y += 17;
        doc.font("Helvetica").fontSize(9).fillColor(gray);
      }
      
      const rowBg = i % 2 === 0 ? "#FAFAFA" : "#FFFFFF";
      doc.rect(50, y, 495, rowHeight).fill(rowBg);

      doc.fillColor(gray);
      doc.text(`${i + 1}`, 58, y + 13, { width: 25 });

      // Item image
      const imgBuf = itemImages[i];
      if (imgBuf) {
        try {
          doc.image(imgBuf, 85, y + 3, { width: 30, height: 30 });
        } catch (e) {
          // Ignore image draw errors
        }
      }

      doc.text(item.name, 125, y + 13, { width: 180 });
      doc.text(`${item.quantity}`, 310, y + 13, { width: 45, align: "center" });
      doc.text(`Rs. ${item.price.toLocaleString("en-IN")}`, 360, y + 13, {
        width: 80,
        align: "right",
      });
      doc.text(`Rs. ${item.subtotal.toLocaleString("en-IN")}`, 445, y + 13, {
        width: 90,
        align: "right",
      });
      y += rowHeight;
    });

    // Divider
    doc
      .moveTo(50, y)
      .lineTo(545, y)
      .strokeColor("#e0e0e0")
      .lineWidth(1)
      .stroke();

    // Check if totals + footer fits on current page (requires approx 150 points)
    if (y + 150 > 800) {
      doc.addPage();
      y = 50;
    }

    // ─── Totals ───
    y += 12;
    doc.font("Helvetica").fontSize(10).fillColor(gray);
    doc.text("Subtotal:", 360, y, { width: 80, align: "right" });
    doc.text(`Rs. ${(sale.totalAmount || 0).toLocaleString("en-IN")}`, 445, y, {
      width: 90,
      align: "right",
    });

    if (sale.discount > 0) {
      y += 18;
      doc.fillColor("#10B981");
      doc.text("Discount:", 360, y, { width: 80, align: "right" });
      doc.text(`- Rs. ${(sale.discount || 0).toLocaleString("en-IN")}`, 445, y, {
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
    doc.text(`Rs. ${(sale.finalPayable || 0).toLocaleString("en-IN")}`, 445, y, {
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
      .text("Thank you for shopping with V Crackers!", 50, y, {
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
