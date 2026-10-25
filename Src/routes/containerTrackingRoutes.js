const express = require("express");
const router = express.Router();
const controller = require("../controller/containerTrackingController");

router.get("/all", controller.getAllContainers);
router.get("/track/:containerNo", controller.trackContainer);

module.exports = router;
