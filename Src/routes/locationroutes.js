const express = require("express");
const router = express.Router();
const locationController = require("../controller/locationcontroller");

// GET /api/locations
router.get("/", locationController.getLocations);

// POST /api/locations
router.post("/", locationController.createLocation);

module.exports = router;
