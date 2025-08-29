//Inits
const express = require("express");
const { fetchAndStoreOrders } = require("../controllers/shopifyFetchOrder");
const router = express.Router();

//Imports

// Define API endpoints and link them to controller functions
router.get("/health", (req, res) => {
  res.send({
    message: "health is ok",
    success: true,
    timestamp: new Date().toISOString(),
  });
});

router.get("/orders",fetchAndStoreOrders)

//Exports
module.exports = router;
