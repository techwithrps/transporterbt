const express = require("express");
const router = express.Router();
const locationController = require("../controller/locationcontroller");

// Get all locations
router.get("/", locationController.getLocations);

// Get location by ID
router.get("/:id", locationController.getLocationById);

// Create location
router.post("/", locationController.createLocation);

// Update location
router.put("/:id", locationController.updateLocation);

// Delete location
router.delete("/:id", locationController.deleteLocation);

module.exports = router;
