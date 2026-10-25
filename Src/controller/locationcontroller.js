const locationModel = require("../models/LocationModel");
const { pool, sql } = require("../config/dbconfig");

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

// Controller to handle DELETE request
const deleteLocation = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.request()
      .input("id", sql.Int, id)
      .query("DELETE FROM location_master WHERE location_id = @id");
    res.status(200).json({ success: true, message: "Location deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getLocations,
  createLocation,
  deleteLocation,
};
