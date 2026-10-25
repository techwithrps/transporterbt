const vehicleModel = require("../models/vehiclemode");
const multer = require("multer");

const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit per file
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      "application/pdf",
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/jpg",
    ];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new Error(
          "Invalid file type. Only PDF and image files (JPG, PNG, WEBP) are allowed."
        ),
        false
      );
    }
  },
});

const uploadVehicleDocs = upload.fields([
  { name: "rc_doc", maxCount: 1 },
  { name: "insurance_doc", maxCount: 1 },
  { name: "fitness_doc", maxCount: 1 },
]);

const getAllVehicles = async (req, res) => {
  try {
    const vehicles = await vehicleModel.getAllVehicles();
    res.status(200).json({ success: true, data: vehicles });
  } catch (err) {
    console.error("Error fetching vehicles:", err);
    res.status(500).json({ success: false, message: "Server Error: " + err.message });
  }
};

const getVehicleById = async (req, res) => {
  try {
    const { id } = req.params;
    const vehicle = await vehicleModel.getVehicleById(id);
    if (!vehicle) {
      return res.status(404).json({ success: false, message: "Vehicle not found" });
    }
    res.status(200).json({ success: true, data: vehicle });
  } catch (err) {
    console.error("Error fetching vehicle:", err);
    res.status(500).json({ success: false, message: "Server Error: " + err.message });
  }
};

const getVehicleDocument = async (req, res) => {
  try {
    const { id, docType } = req.params;
    if (!id || isNaN(id)) {
      return res.status(400).json({ success: false, message: "Valid vehicle ID is required" });
    }

    const doc = await vehicleModel.getVehicleDocument(id, docType);
    if (!doc || !doc.data) {
      return res.status(404).json({ success: false, message: "Document not found" });
    }

    const fileName = doc.name || `vehicle_${id}_${docType}`;
    const contentType = doc.type || "application/octet-stream";

    res.set({
      "Content-Type": contentType,
      "Content-Length": doc.data.length,
      "Content-Disposition": `inline; filename="${fileName}"`,
      "Cache-Control": "public, max-age=31536000",
    });

    res.send(doc.data);
  } catch (err) {
    console.error("Error fetching vehicle document:", err);
    res.status(500).json({ success: false, message: err.message || "Failed to fetch vehicle document" });
  }
};

const createVehicle = async (req, res) => {
  try {
    const { vehicle_number } = req.body;
    if (!vehicle_number || !vehicle_number.trim()) {
      return res.status(400).json({ success: false, message: "vehicle_number is required" });
    }
    const files = req.files || {};
    const vehicle = await vehicleModel.createVehicle(req.body, files);
    res.status(201).json({ success: true, vehicle });
  } catch (err) {
    console.error("Error creating vehicle:", err);
    res.status(500).json({ success: false, message: "Error creating vehicle: " + err.message });
  }
};

const updateVehicle = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id || isNaN(id)) {
      return res.status(400).json({ success: false, message: "Valid vehicle ID is required" });
    }
    const files = req.files || {};
    await vehicleModel.updateVehicle(id, req.body, files);
    res.status(200).json({ success: true, message: "Vehicle updated successfully" });
  } catch (err) {
    console.error("Error updating vehicle:", err);
    res.status(500).json({ success: false, message: "Error updating vehicle: " + err.message });
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
  uploadMiddleware: uploadVehicleDocs,
  getAllVehicles,
  getVehicleById,
  getVehicleDocument,
  createVehicle,
  updateVehicle,
  deleteVehicle,
};
