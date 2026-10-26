const locationModel = require("../models/LocationModel");

// Controller to handle GET all request
const getLocations = async (req, res) => {
  try {
    const locations = await locationModel.getAllLocations();
    res.status(200).json(locations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Controller to handle GET by ID request
const getLocationById = async (req, res) => {
  try {
    const { id } = req.params;
    const location = await locationModel.getLocationById(id);
    if (!location) {
      return res.status(404).json({ success: false, message: "Location not found" });
    }
    res.status(200).json({ success: true, location });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
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

// Controller to handle PUT (update) request
const updateLocation = async (req, res) => {
  try {
    const { id } = req.params;
    const { location_name } = req.body;
    if (!location_name || location_name.trim().length === 0) {
      return res.status(400).json({ success: false, message: "location_name is required" });
    }
    const location = await locationModel.updateLocation(id, req.body);
    if (!location) {
      return res.status(404).json({ success: false, message: "Location not found" });
    }
    res.status(200).json({ success: true, location });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Controller to handle DELETE request
const deleteLocation = async (req, res) => {
  try {
    const { id } = req.params;
    await locationModel.deleteLocation(id);
    res.status(200).json({ success: true, message: "Location deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getLocations,
  getLocationById,
  createLocation,
  updateLocation,
  deleteLocation,
};
