const express = require("express");
const router = express.Router();
const { createPosBill } = require("../controllers/posController");
const { protect, adminOnly } = require("../middleware/auth");

router.post("/bill", protect, adminOnly, createPosBill);

module.exports = router;
