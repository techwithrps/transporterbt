const express = require("express");
const router = express.Router();
const asnController = require("../controller/asnController");

// Mount paths with /asn prefix
router.get("/asn", asnController.getAll);
router.get("/asn/:id", asnController.getById);
router.post("/asn", asnController.create);
router.put("/asn/:id", asnController.update);
router.delete("/asn/:id", asnController.remove);
router.post("/asn/bulk", asnController.createBulk);

// Mount paths without /asn prefix (when mounted at /api/asn)
router.get("/", asnController.getAll);
router.get("/:id", asnController.getById);
router.post("/", asnController.create);
router.put("/:id", asnController.update);
router.delete("/:id", asnController.remove);
router.post("/bulk", asnController.createBulk);

module.exports = router;
