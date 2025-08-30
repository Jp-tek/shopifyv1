//Inits
const express = require("express");
const router = express.Router();

//Imports
const { fetchAndStoreOrders } = require("../controllers/shopifyFetchOrder");
const { saveOrdersAsShipments } = require("../controllers/shipmentDataVerification");

// Define API endpoints and link them to controller functions
router.get("/health", (req, res) => {
  res.send({
    message: "health is ok",
    success: true,
    timestamp: new Date().toISOString(),
  });
});

router.get("/orders",fetchAndStoreOrders)
router.get("/orders/process",saveOrdersAsShipments)

//Exports
module.exports = router;
