const express = require("express");
const router = express.Router();
const vehicleController = require("../controller/vehiclecontroller");
const auth = require("../middlewares/auth");

// Specific routes first
router.get("/vehicles/:id/document/:docType", auth, vehicleController.getVehicleDocument);
router.get("/:id/document/:docType", auth, vehicleController.getVehicleDocument);

router.get("/vehicles/:id", auth, vehicleController.getVehicleById);
router.get("/vehicles", auth, vehicleController.getAllVehicles);

// When mounted directly on /api/vehicles or /vehicles
router.get("/:id", auth, vehicleController.getVehicleById);
router.get("/", auth, vehicleController.getAllVehicles);

// Create
router.post("/vehicles", auth, vehicleController.uploadMiddleware, vehicleController.createVehicle);
router.post("/", auth, vehicleController.uploadMiddleware, vehicleController.createVehicle);

// Update
router.put("/vehicles/:id", auth, vehicleController.uploadMiddleware, vehicleController.updateVehicle);
router.put("/:id", auth, vehicleController.uploadMiddleware, vehicleController.updateVehicle);

// Delete
router.delete("/vehicles/:id", auth, vehicleController.deleteVehicle);
router.delete("/:id", auth, vehicleController.deleteVehicle);

module.exports = router;
