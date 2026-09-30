const Setting = require("../models/Setting");

const getSettings = async (req, res) => {
  try {
    const settings = await Setting.find();
    const config = {};
    settings.forEach((s) => {
      config[s.key] = s.value;
    });

    // Defaults if not set
    if (config.packagingChargeEnabled === undefined) {
      config.packagingChargeEnabled = true;
      config.packagingChargePercentage = 2;
    }
    if (config.googleReviewUrl === undefined) {
      config.googleReviewUrl = "";
    }

    res.json({ success: true, settings: config });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const updateSettings = async (req, res) => {
  try {
    const { settings } = req.body;
    if (!settings || typeof settings !== "object") {
      return res.status(400).json({ success: false, message: "Invalid settings data" });
    }

    for (const [key, value] of Object.entries(settings)) {
      await Setting.findOneAndUpdate(
        { key },
        { value },
        { upsert: true, new: true }
      );
    }

    res.json({ success: true, message: "Settings updated successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  getSettings,
  updateSettings,
};
