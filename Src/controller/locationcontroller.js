const locationModel = require("../models/LocationModel");

// Controller to handle GET request
const getLocations = async (req, res) => {
  try {
    const locations = await locationModel.getAllLocations();
    res.status(200).json(locations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Controller to handle POST request
const createLocation = async (req, res) => {
  try {
    const { location_name } = req.body;
    if (!location_name || location_name.trim().length === 0) {
      return res.status(400).json({ success: false, message: "location_name is required" });
    }
    const location = await locationModel.createLocation(req.body);
    res.status(201).json({ success: true, location });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getLocations,
  createLocation,
};
