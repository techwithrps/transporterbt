const express = require("express");
const router = express.Router();
const vehicleController = require("../controller/vehiclecontroller");

router.get("/", vehicleController.getAllVehicles);
router.get("/vehicles", vehicleController.getAllVehicles);
router.post("/", vehicleController.createVehicle);
router.post("/vehicles", vehicleController.createVehicle);
router.delete("/:id", vehicleController.deleteVehicle);
router.delete("/vehicles/:id", vehicleController.deleteVehicle);

module.exports = router;
