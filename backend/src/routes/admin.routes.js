const express = require("express");
const authenticateAdmin = require("../middleware/authenticateAdmin");
const adminController = require("../controllers/admin.controller");

const router = express.Router();

router.use(authenticateAdmin);

router.post("/keys", adminController.createKey);
router.get("/keys", adminController.listKeys);
router.patch("/keys/:id/deactivate", adminController.deactivateKey);
router.post("/keys/:id/deactivate", adminController.deactivateKey);

router.get("/usage", adminController.getUsage);
router.get("/usage/:keyId", adminController.getKeyUsage);

module.exports = router;
