/**
 * ╔══════════════════════════════════════════════════════════════════╗
 * ║         V CRACKERS – BULK WHATSAPP PRICELIST SENDER             ║
 * ╠══════════════════════════════════════════════════════════════════╣
 * ║  Sends a WhatsApp template message with a PDF attachment to     ║
 * ║  all phone numbers from an Excel/CSV file.                      ║
 * ║                                                                  ║
 * ║  USAGE:                                                          ║
 * ║    node scripts/bulkWhatsappSend.js                              ║
 * ║    node scripts/bulkWhatsappSend.js --dry-run                    ║
 * ║                                                                  ║
 * ║  PREREQUISITES:                                                  ║
 * ║    1. WhatsApp Business API credentials in .env                  ║
 * ║    2. An approved MARKETING template with DOCUMENT header        ║
 * ║    3. Excel/CSV file with customer phone numbers                 ║
 * ║    4. The pricelist PDF file                                     ║
 * ╚══════════════════════════════════════════════════════════════════╝
 */

require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });
const fs = require("fs");
const path = require("path");
const readline = require("readline");
const XLSX = require("xlsx");
const whatsapp = require("../config/whatsappService");

// ══════════════════════════════════════════════════════════════════
// 🔧 CONFIGURATION – UPDATE THESE BEFORE RUNNING
// ══════════════════════════════════════════════════════════════════

/** Full path to the Excel/CSV file containing customer phone numbers */
const EXCEL_PATH = "";
// Example: "C:/Users/ADMIN/Desktop/customers.xlsx"

/** Full path to the pricelist PDF to attach */
const PDF_PATH = "";
// Example: "C:/Users/ADMIN/Desktop/V-Crackers-Pricelist-2026.pdf"

/** Your approved WhatsApp template name from Meta Business Manager */
const TEMPLATE_NAME = "pricelist_2026";

/** Template language code (as submitted in Meta Business Manager) */
const TEMPLATE_LANGUAGE = "en";

/**
 * Delay between each message in milliseconds.
 * - 200ms = ~5 msgs/sec  (safe for most tiers)
 * - 100ms = ~10 msgs/sec (for higher tier accounts)
 * - 500ms = ~2 msgs/sec  (ultra-safe / new accounts)
 */
const DELAY_BETWEEN_MESSAGES_MS = 200;

/**
 * Phone number column name in the Excel file.
 * Leave empty ("") to auto-detect from common names like
 * "phone", "mobile", "Phone Number", "WhatsApp", etc.
 */
const PHONE_COLUMN = "";

// ══════════════════════════════════════════════════════════════════
// END CONFIGURATION
// ══════════════════════════════════════════════════════════════════

const DRY_RUN = process.argv.includes("--dry-run");
const LOG_DIR = path.join(__dirname, "..", "logs");

// ─── Helpers ────────────────────────────────────────────────────

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const timestamp = () => new Date().toLocaleTimeString("en-IN", { hour12: false });

const formatDuration = (ms) => {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return m > 0 ? `${m}m ${sec}s` : `${sec}s`;
};

const ask = (question) => {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim().toLowerCase());
    });
  });
};

// ─── Phone Number Extraction ────────────────────────────────────

const PHONE_COLUMN_NAMES = [
  "phone", "mobile", "phone number", "phonenumber",
  "mobile number", "mobilenumber", "contact", "whatsapp",
  "number", "phone no", "mobile no", "cell", "telephone",
  "contact number", "wa number",
];

function detectPhoneColumn(headers) {
  if (PHONE_COLUMN) return PHONE_COLUMN;

  for (const candidate of PHONE_COLUMN_NAMES) {
    const match = headers.find((h) => h.toLowerCase().trim() === candidate);
    if (match) return match;
  }

  // Partial match fallback
  for (const candidate of PHONE_COLUMN_NAMES) {
    const match = headers.find((h) => h.toLowerCase().trim().includes(candidate));
    if (match) return match;
  }

  return null;
}

function normalizePhone(raw) {
  let p = String(raw || "").trim();

  // Remove all non-digit characters
  p = p.replace(/[^\d]/g, "");

  // Handle common formats
  if (p.length === 10 && /^[6-9]\d{9}$/.test(p)) {
    return "91" + p; // Indian 10-digit mobile
  }
  if (p.length === 12 && p.startsWith("91")) {
    return p; // Already has country code
  }
  if (p.length === 13 && p.startsWith("091")) {
    return p.substring(1); // Remove leading 0
  }

  return null; // Invalid
}

function extractPhoneNumbers(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const workbook = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const data = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

  if (data.length === 0) {
    throw new Error("Excel/CSV file is empty.");
  }

  const headers = Object.keys(data[0]);
  const phoneCol = detectPhoneColumn(headers);

  if (!phoneCol) {
    throw new Error(
      `Could not detect phone column.\n` +
      `  Available columns: ${headers.join(", ")}\n` +
      `  Set PHONE_COLUMN in the script configuration.`
    );
  }

  console.log(`  📱 Phone column: "${phoneCol}"`);

  const phones = [];
  const skipped = [];

  for (let i = 0; i < data.length; i++) {
    const raw = data[i][phoneCol];
    const normalized = normalizePhone(raw);

    if (normalized) {
      phones.push(normalized);
    } else {
      skipped.push({ row: i + 2, value: raw }); // +2 for header + 0-index
    }
  }

  // Deduplicate
  const unique = [...new Set(phones)];
  const duplicates = phones.length - unique.length;

  return { phones: unique, skipped, duplicates, totalRows: data.length };
}

// ─── Main ───────────────────────────────────────────────────────

async function main() {
  console.log("\n╔══════════════════════════════════════════════════════╗");
  console.log("║   V CRACKERS – BULK WHATSAPP PRICELIST SENDER       ║");
  console.log("╚══════════════════════════════════════════════════════╝\n");

  if (DRY_RUN) {
    console.log("🏃 DRY RUN MODE – No messages will actually be sent.\n");
  }

  // ── Validate Configuration ──
  if (!EXCEL_PATH) {
    console.error("❌ EXCEL_PATH is not set. Open the script and set the path to your Excel/CSV file.");
    process.exit(1);
  }
  if (!PDF_PATH) {
    console.error("❌ PDF_PATH is not set. Open the script and set the path to your pricelist PDF.");
    process.exit(1);
  }
  if (!fs.existsSync(EXCEL_PATH)) {
    console.error(`❌ Excel file not found: ${EXCEL_PATH}`);
    process.exit(1);
  }
  if (!fs.existsSync(PDF_PATH)) {
    console.error(`❌ PDF file not found: ${PDF_PATH}`);
    process.exit(1);
  }
  if (!whatsapp.isConfigured) {
    console.error("❌ WhatsApp credentials not configured in .env");
    console.error("   Required: WHATSAPP_PHONE_NUMBER_ID and WHATSAPP_ACCESS_TOKEN");
    process.exit(1);
  }

  // ── Read Phone Numbers ──
  console.log("📂 Reading phone numbers...");
  const { phones, skipped, duplicates, totalRows } = extractPhoneNumbers(EXCEL_PATH);

  console.log(`  📊 Total rows: ${totalRows}`);
  console.log(`  ✅ Valid numbers: ${phones.length}`);
  if (duplicates > 0) console.log(`  🔄 Duplicates removed: ${duplicates}`);
  if (skipped.length > 0) console.log(`  ⚠️  Skipped (invalid): ${skipped.length}`);

  if (phones.length === 0) {
    console.error("\n❌ No valid phone numbers found. Check your Excel file.");
    process.exit(1);
  }

  // ── Upload PDF ──
  const pdfFilename = path.basename(PDF_PATH);
  const pdfSize = (fs.statSync(PDF_PATH).size / (1024 * 1024)).toFixed(2);
  console.log(`\n📎 PDF: ${pdfFilename} (${pdfSize} MB)`);

  let mediaId = null;
  if (!DRY_RUN) {
    console.log("📤 Uploading PDF to WhatsApp Media API...");
    const pdfBuffer = fs.readFileSync(PDF_PATH);
    mediaId = await whatsapp.uploadMedia(pdfBuffer, pdfFilename, "application/pdf");

    if (!mediaId) {
      console.error("❌ Failed to upload PDF. Check your WhatsApp credentials and try again.");
      process.exit(1);
    }
    console.log(`  ✅ Upload successful. Media ID: ${mediaId}`);
  } else {
    mediaId = "DRY_RUN_MEDIA_ID";
    console.log("  ⏭️  Skipped upload (dry run)");
  }

  // ── Confirmation ──
  const estimatedTime = Math.ceil((phones.length * DELAY_BETWEEN_MESSAGES_MS) / 60000);

  console.log("\n" + "═".repeat(54));
  console.log("  📋 SEND SUMMARY");
  console.log("═".repeat(54));
  console.log(`  Template   : ${TEMPLATE_NAME}`);
  console.log(`  Language   : ${TEMPLATE_LANGUAGE}`);
  console.log(`  Recipients : ${phones.length}`);
  console.log(`  PDF        : ${pdfFilename}`);
  console.log(`  Rate       : ~${Math.round(1000 / DELAY_BETWEEN_MESSAGES_MS)} msgs/sec`);
  console.log(`  Est. Time  : ~${estimatedTime} minutes`);
  console.log("═".repeat(54));

  if (!DRY_RUN) {
    const answer = await ask(`\n⚠️  Send to ${phones.length} numbers? (yes/no): `);
    if (answer !== "yes" && answer !== "y") {
      console.log("❌ Cancelled by user.");
      process.exit(0);
    }
  }

  // ── Send Messages ──
  const results = { sent: 0, failed: 0, errors: [] };
  const startTime = Date.now();

  console.log(`\n🚀 Sending started at ${timestamp()}...\n`);

  for (let i = 0; i < phones.length; i++) {
    const phone = phones[i];

    try {
      if (!DRY_RUN) {
        await whatsapp.sendDocumentTemplate(phone, {
          mediaId,
          filename: pdfFilename,
          templateName: TEMPLATE_NAME,
          language: TEMPLATE_LANGUAGE,
        });
      }
      results.sent++;
    } catch (err) {
      results.failed++;
      const errorMsg = err.response?.data?.error?.message || err.message;
      results.errors.push({ phone, error: errorMsg });

      // If we get rate limited, wait extra time
      if (err.response?.status === 429) {
        console.log(`  ⏳ Rate limited! Waiting 60s before resuming...`);
        await sleep(60000);
      }
    }

    // Progress log every 100 messages (or every 25 in dry run)
    const logInterval = DRY_RUN ? 25 : 100;
    if ((i + 1) % logInterval === 0 || i === phones.length - 1) {
      const elapsed = formatDuration(Date.now() - startTime);
      const pct = (((i + 1) / phones.length) * 100).toFixed(1);
      const bar = "█".repeat(Math.floor(pct / 5)) + "░".repeat(20 - Math.floor(pct / 5));
      console.log(
        `  [${bar}] ${pct}%  |  ${i + 1}/${phones.length}  |  ✅ ${results.sent}  ❌ ${results.failed}  |  ${elapsed}`
      );
    }

    // Delay between messages
    if (i < phones.length - 1) {
      await sleep(DRY_RUN ? 1 : DELAY_BETWEEN_MESSAGES_MS);
    }
  }

  // ── Results ──
  const totalTime = formatDuration(Date.now() - startTime);

  console.log(`\n${"═".repeat(54)}`);
  console.log(`  📊 BULK SEND ${DRY_RUN ? "(DRY RUN) " : ""}COMPLETE`);
  console.log(`${"═".repeat(54)}`);
  console.log(`  Total      : ${phones.length}`);
  console.log(`  ✅ Sent     : ${results.sent}`);
  console.log(`  ❌ Failed   : ${results.failed}`);
  console.log(`  ⏱  Duration : ${totalTime}`);
  console.log(`${"═".repeat(54)}`);

  // ── Save Failure Log ──
  if (results.errors.length > 0) {
    if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR, { recursive: true });

    const logFile = path.join(
      LOG_DIR,
      `bulk_send_failures_${new Date().toISOString().slice(0, 10)}.csv`
    );
    const csvLines = ["Phone,Error"];
    for (const e of results.errors) {
      csvLines.push(`${e.phone},"${e.error.replace(/"/g, '""')}"`);
    }
    fs.writeFileSync(logFile, csvLines.join("\n"), "utf-8");
    console.log(`\n📋 Failed numbers saved to: ${logFile}`);
  }

  // ── Save Skipped Numbers Log ──
  if (skipped.length > 0) {
    if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR, { recursive: true });

    const skipFile = path.join(
      LOG_DIR,
      `bulk_send_skipped_${new Date().toISOString().slice(0, 10)}.csv`
    );
    const csvLines = ["Row,OriginalValue"];
    for (const s of skipped) {
      csvLines.push(`${s.row},"${String(s.value || "").replace(/"/g, '""')}"`);
    }
    fs.writeFileSync(skipFile, csvLines.join("\n"), "utf-8");
    console.log(`📋 Skipped numbers saved to: ${skipFile}`);
  }

  console.log("");
  process.exit(results.failed > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error("\n💥 Fatal error:", err.message);
  process.exit(1);
});
