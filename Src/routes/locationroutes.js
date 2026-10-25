const express = require("express");
const router = express.Router();
const locationController = require("../controller/locationcontroller");

// GET /api/locations
router.get("/", locationController.getLocations);

// POST /api/locations
router.post("/", locationController.createLocation);

// DELETE /api/locations/:id
router.delete("/:id", locationController.deleteLocation);

module.exports = router;
