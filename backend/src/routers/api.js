//Inits
const express = require("express");
const router = express.Router();

//Imports
const { fetchAndStoreOrders } = require("../controllers/shopifyFetchOrder");
const { saveOrdersAsShipments } = require("../controllers/shipmentDataVerification");
const { updateOrders } = require("../controllers/updateOrderDetails");
const { updateAndSyncOrders } = require("../controllers/updateAndSync");

// Define API endpoints and link them to controller functions
router.get("/health", (req, res) => {
  res.send({
    message: "health is ok",
    success: true,
    timestamp: new Date().toISOString(),
  });
});

router.get("/orders",fetchAndStoreOrders);
router.get("/orders/process",saveOrdersAsShipments);
router.get("/orders/update",updateOrders);
router.get("/orders/sync",updateAndSyncOrders)

//Exports
module.exports = router;
