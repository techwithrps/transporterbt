const vehicleModel = require("../models/vehiclemode");

const getAllVehicles = async (req, res) => {
  try {
    const vehicles = await vehicleModel.getAllVehicles();
    res.status(200).json({ success: true, data: vehicles });
  } catch (err) {
    console.error("Error fetching vehicles:", err);
    res.status(500).json({ success: false, message: "Server Error: " + err.message });
  }
};

const createVehicle = async (req, res) => {
  try {
    const { vehicle_number } = req.body;
    if (!vehicle_number || !vehicle_number.trim()) {
      return res.status(400).json({ success: false, message: "vehicle_number is required" });
    }
    const vehicle = await vehicleModel.createVehicle(req.body);
    res.status(201).json({ success: true, vehicle });
  } catch (err) {
    console.error("Error creating vehicle:", err);
    res.status(500).json({ success: false, message: "Error creating vehicle: " + err.message });
  }
};

const deleteVehicle = async (req, res) => {
  try {
    const { id } = req.params;
    await vehicleModel.deleteVehicle(id);
    res.status(200).json({ success: true, message: "Vehicle deleted successfully" });
  } catch (err) {
    console.error("Error deleting vehicle:", err);
    res.status(500).json({ success: false, message: "Error deleting vehicle: " + err.message });
  }
};

module.exports = {
  getAllVehicles,
  createVehicle,
  deleteVehicle,
};
