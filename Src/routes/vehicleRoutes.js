const express = require("express");
const router = express.Router();
const vehicleController = require("../controller/vehiclecontroller");
const auth = require("../middlewares/auth");

// Document stream route - MUST come before /:id routes
router.get("/vehicles/:id/document/:docType", auth, vehicleController.getVehicleDocument);
router.get("/:id/document/:docType", auth, vehicleController.getVehicleDocument);

// Get single vehicle
router.get("/vehicles/:id", auth, vehicleController.getVehicleById);
router.get("/:id", auth, vehicleController.getVehicleById);

// Get all vehicles
router.get("/", auth, vehicleController.getAllVehicles);
router.get("/vehicles", auth, vehicleController.getAllVehicles);

// Create vehicle
router.post(
  "/",
  auth,
  vehicleController.uploadMiddleware,
  vehicleController.createVehicle
);
router.post(
  "/vehicles",
  auth,
  vehicleController.uploadMiddleware,
  vehicleController.createVehicle
);

// Update vehicle
router.put(
  "/:id",
  auth,
  vehicleController.uploadMiddleware,
  vehicleController.updateVehicle
);
router.put(
  "/vehicles/:id",
  auth,
  vehicleController.uploadMiddleware,
  vehicleController.updateVehicle
);

// Delete vehicle
router.delete("/:id", auth, vehicleController.deleteVehicle);
router.delete("/vehicles/:id", auth, vehicleController.deleteVehicle);

module.exports = router;
