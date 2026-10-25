const DriverModel = require("../models/DriverModel");
const multer = require("multer");

// Multer in-memory storage for document uploads
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

const uploadDriverDocs = upload.fields([
  { name: "dl_doc", maxCount: 1 },
  { name: "address_doc", maxCount: 1 },
  { name: "image", maxCount: 1 },
]);

class DriverController {
  static uploadMiddleware = uploadDriverDocs;

  // Get all drivers
  static async getAllDrivers(req, res) {
    try {
      const drivers = await DriverModel.getAll();
      res.json({ success: true, data: drivers });
    } catch (error) {
      console.error("Get all drivers controller error:", error);
      res.status(500).json({ success: false, error: "Failed to fetch drivers." });
    }
  }

  // Get drivers by vendor ID
  static async getDriversByVendorId(req, res) {
    try {
      const { vendorId } = req.params;
      if (!vendorId || isNaN(vendorId)) {
        return res.status(400).json({ success: false, error: "Valid vendor ID is required." });
      }
      const drivers = await DriverModel.getByVendorId(vendorId);
      res.json({ success: true, data: drivers });
    } catch (error) {
      console.error("Get drivers by vendor ID controller error:", error);
      res.status(500).json({ success: false, error: "Failed to fetch drivers for this vendor." });
    }
  }

  // Get driver by ID
  static async getDriverById(req, res) {
    try {
      const { id } = req.params;
      if (!id || isNaN(id)) {
        return res.status(400).json({ success: false, error: "Valid driver ID is required." });
      }
      const driver = await DriverModel.getById(id);
      if (!driver) {
        return res.status(404).json({ success: false, message: "Driver not found." });
      }
      res.json({ success: true, data: driver });
    } catch (error) {
      console.error("Get driver by ID controller error:", error);
      res.status(500).json({ success: false, error: "Failed to fetch driver details." });
    }
  }

  // Get driver document stream (DL, Address, Photo)
  static async getDriverDocument(req, res) {
    try {
      const { id, docType } = req.params;
      if (!id || isNaN(id)) {
        return res.status(400).json({ success: false, error: "Valid driver ID is required." });
      }

      const doc = await DriverModel.getDriverDocument(id, docType);
      if (!doc || !doc.data) {
        return res.status(404).json({ success: false, error: "Document not found." });
      }

      const fileName = doc.name || `driver_${id}_${docType}`;
      const contentType = doc.type || "application/octet-stream";

      res.set({
        "Content-Type": contentType,
        "Content-Length": doc.data.length,
        "Content-Disposition": `inline; filename="${fileName}"`,
        "Cache-Control": "public, max-age=31536000",
      });

      res.send(doc.data);
    } catch (error) {
      console.error("Get driver document error:", error);
      res.status(500).json({ success: false, error: error.message || "Failed to fetch driver document." });
    }
  }

  // Create new driver
  static async createDriver(req, res) {
    try {
      const data = req.body;
      const files = req.files || {};

      if (!data.vendor_id) {
        return res.status(400).json({ success: false, error: "Vendor ID is required." });
      }
      if (!data.driver_name) {
        return res.status(400).json({ success: false, error: "Driver name is required." });
      }
      if (isNaN(data.vendor_id)) {
        return res.status(400).json({ success: false, error: "Vendor ID must be a valid number." });
      }
      if (req.user && req.user.userId) {
        data.created_by = req.user.userId;
      }

      const result = await DriverModel.create(data, files);
      res.status(201).json({ success: true, message: "Driver created successfully.", data: result });
    } catch (error) {
      console.error("Create driver controller error:", error);
      if (error.message && (error.message.includes("FK_DRIVER_VENDOR") || error.message.includes("FOREIGN KEY"))) {
        return res.status(400).json({ success: false, error: "Invalid vendor ID. Vendor does not exist." });
      }
      if (error.message && error.message.includes("PRIMARY KEY")) {
        return res.status(400).json({ success: false, error: "Driver ID already exists. Please try again." });
      }
      res.status(500).json({
        success: false,
        error: error.message || "Failed to create driver.",
      });
    }
  }

  // Update driver
  static async updateDriver(req, res) {
    try {
      const { id } = req.params;
      const data = req.body;
      const files = req.files || {};

      if (!id || isNaN(id)) {
        return res.status(400).json({ success: false, error: "Valid driver ID is required." });
      }
      if (!data.driver_name) {
        return res.status(400).json({ success: false, error: "Driver name is required." });
      }
      if (data.vendor_id && isNaN(data.vendor_id)) {
        return res.status(400).json({ success: false, error: "Vendor ID must be a valid number." });
      }

      const existingDriver = await DriverModel.getById(id);
      if (!existingDriver) {
        return res.status(404).json({ success: false, error: "Driver not found." });
      }

      await DriverModel.update(id, data, files);
      res.json({ success: true, message: "Driver updated successfully." });
    } catch (error) {
      console.error("Update driver controller error:", error);
      if (error.message && (error.message.includes("FK_DRIVER_VENDOR") || error.message.includes("FOREIGN KEY"))) {
        return res.status(400).json({ success: false, error: "Invalid vendor ID. Vendor does not exist." });
      }
      res.status(500).json({
        success: false,
        error: error.message || "Failed to update driver.",
      });
    }
  }

  // Delete driver
  static async deleteDriver(req, res) {
    try {
      const { id } = req.params;
      if (!id || isNaN(id)) {
        return res.status(400).json({ success: false, error: "Valid driver ID is required." });
      }

      const existingDriver = await DriverModel.getById(id);
      if (!existingDriver) {
        return res.status(404).json({ success: false, error: "Driver not found." });
      }

      await DriverModel.delete(id);
      res.json({ success: true, message: "Driver deleted successfully." });
    } catch (error) {
      console.error("Delete driver controller error:", error);
      if (error.message && error.message.includes("FOREIGN KEY")) {
        return res.status(400).json({
          success: false,
          error: "Cannot delete driver. Driver is being used in other records.",
        });
      }
      res.status(500).json({
        success: false,
        error: error.message || "Failed to delete driver.",
      });
    }
  }

  // Get vendors for dropdown
  static async getVendors(req, res) {
    try {
      const vendors = await DriverModel.getVendors();
      res.json({ success: true, data: vendors });
    } catch (error) {
      console.error("Get vendors controller error:", error);
      res.status(500).json({ success: false, error: "Failed to fetch vendors." });
    }
  }
}

module.exports = DriverController;
