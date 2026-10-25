const express = require("express");
const router = express.Router();
const DriverController = require("../controller/driverController");
const auth = require("../middlewares/auth");

// Get all drivers
router.get("/drivers", auth, DriverController.getAllDrivers);

// Get drivers by vendor ID
router.get("/drivers/vendor/:vendorId", auth, DriverController.getDriversByVendorId);

// Get vendors for dropdown
router.get("/drivers/vendors/list", auth, DriverController.getVendors);

// Get driver document (DL, Address proof, Photo)
router.get("/drivers/:id/document/:docType", auth, DriverController.getDriverDocument);

// Get driver by ID
router.get("/drivers/:id", auth, DriverController.getDriverById);

// Create new driver with document uploads
router.post(
  "/drivers",
  auth,
  DriverController.uploadMiddleware,
  DriverController.createDriver
);

// Update driver with document uploads
router.put(
  "/drivers/:id",
  auth,
  DriverController.uploadMiddleware,
  DriverController.updateDriver
);

// Delete driver
router.delete("/drivers/:id", auth, DriverController.deleteDriver);

module.exports = router;
