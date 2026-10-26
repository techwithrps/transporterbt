const express = require("express");
const router = express.Router();
const CustomerMasterController = require("../controller/customermastercontroller");

router.get("/customers", CustomerMasterController.getAllCustomers);
router.get("/", CustomerMasterController.getAllCustomers);

router.post("/customers", CustomerMasterController.createCustomer);
router.post("/", CustomerMasterController.createCustomer);

module.exports = router;
