const Order = require("../models/ordersRaw");
const Shipment = require("../models/shipmentSchema");

// The mapping function to transform data with detailed error reporting
function mapOrderData(orderData) {
  // Array to hold validation error messages
  const errors = [];

  // Check for invalid or missing required top-level properties
  if (!orderData) {
    errors.push("Order document is null or undefined.");
  }
  if (!orderData.shipping_address) {
    errors.push('Missing "shipping_address" field.');
  }
  if (!orderData.customer) {
    errors.push('Missing "customer" field.');
  }
  if (!orderData.line_items || orderData.line_items.length === 0) {
    errors.push('Missing or empty "line_items" array.');
  }

  // If any critical top-level data is missing, return immediately with errors
  if (errors.length > 0) {
    return {
      status: "error",
      message: "Invalid order data provided.",
      details: errors,
      originalDocId: orderData._id || "N/A",
    };
  }

  const {
    shipping_address,
    customer,
    name,
    processed_at,
    total_price,
    line_items,
    financial_status,
    phone,
  } = orderData;

  const firstLineItem = line_items[0] || {};
  const { quantity, title, sku, grams, vendor } = firstLineItem;

  // Set default values if data is missing, and log specific issues
  const shipmentName = shipping_address.name || "";
  if (!shipping_address.name)
    errors.push('Missing "shipping_address.name". Defaulting to empty string.');

  const orderNumber = name || "N/A";
  if (!name) errors.push('Missing "name". Defaulting to "N/A".');

  const phoneno = phone || "null";
  if (!phoneno)
    errors.push(
      'Missing "phone" from shipping_address or customer.default_address. Defaulting to an empty string.'
    );

  const address = shipping_address.address1 || "default";
  if (!shipping_address.address1)
    errors.push(
      'Missing "shipping_address.address1". Defaulting to "default".'
    );

  const pinCode = shipping_address.zip ? parseInt(shipping_address.zip, 10) : 0;
  if (!shipping_address.zip)
    errors.push('Missing "shipping_address.zip". Defaulting to 0.');
  if (isNaN(pinCode)) {
    errors.push(
      'Invalid "shipping_address.zip" value. Could not parse to integer. Defaulting to 0.'
    );
  }

  const pickupLocation = "warehouse_name";
  const hsnCode = sku || "";
  const weightInKg = grams ? parseFloat((grams / 1000).toFixed(2)) : 0;
  if (!grams)
    errors.push('Missing "grams" from line item. Defaulting weight to 0.');

  const productsDesc = title || "";
  const sellerName = vendor || "";
  const city = shipping_address.city || "";
  const state = shipping_address.province || "";
  const country = shipping_address.country || "";

  const totalAmount = parseFloat(total_price) || 0;
  if (isNaN(totalAmount))
    errors.push(
      'Invalid "total_price" value. Could not parse to number. Defaulting to 0.'
    );

  const paymentMode = financial_status === "paid" ? "Prepaid" : "COD";
  const codAmount = paymentMode === "COD" ? totalAmount : 0;

  const quantityStr = quantity ? String(quantity) : "1";
  if (!quantity)
    errors.push('Missing "quantity" from line item. Defaulting to "1".');

  const mappedData = {
    name: shipmentName,
    order: orderNumber,
    phone: phoneno,
    add: address,
    pin: pinCode,
    pickup_location: pickupLocation,
    address_type: "home",
    ewbn: "",
    hsn_code: hsnCode,
    shipping_mode: "Surface",
    seller_inv: "",
    city: city,
    weight: weightInKg,
    return_name: "",
    return_address: "",
    return_city: "",
    return_phone: [""],
    return_state: "",
    return_country: "",
    return_pin: 0,
    seller_name: sellerName,
    fragile_shipment: false,
    shipment_height: 100,
    shipment_width: 100,
    shipment_length: 0,
    cod_amount: codAmount,
    products_desc: productsDesc,
    state: state,
    dangerous_good: false,
    waybill: "",
    total_amount: totalAmount,
    seller_add: "",
    country: country,
    plastic_packaging: false,
    quantity: quantityStr,
  };

  // If there were any non-critical issues, return them with the data
  if (errors.length > 0) {
    return {
      status: "warning",
      message:
        "Some fields were missing or invalid. Default values have been used.",
      details: errors,
      originalDocId: orderData._id,
      data: mappedData,
    };
  }

  // If everything is fine, return the mapped data directly
  return {
    status: "success",
    data: mappedData,
  };
}

// Controller function to fetch and save orders as shipments
exports.saveOrdersAsShipments = async (req, res) => {
  try {
    const orders = await Order.find({}); // Fetch all orders

    const mappingResults = {
      saved: [],
      failed: [],
      warnings: [],
      skipped: [], // Add a new array for skipped documents
    };

    const shipmentsToSave = [];

    for (const orderDoc of orders) {
      // Step 1: Check for existing document in the Shipment collection
      const orderNumber = orderDoc.name || "N/A";
      const existingShipment = await Shipment.findOne({
        order: orderNumber,
      });

      if (existingShipment) {
        // Document already exists, skip it
        mappingResults.skipped.push({
          id: orderDoc._id,
          message: `Shipment for order ${orderNumber} already exists.`,
        });
        continue; // Move to the next order in the loop
      }

      // Step 2: If no duplicate is found, proceed with mapping
      const mappedResult = mapOrderData(orderDoc);

      if (mappedResult.status === "success") {
        shipmentsToSave.push(mappedResult.data);
      } else if (mappedResult.status === "warning") {
        shipmentsToSave.push(mappedResult.data);
        mappingResults.warnings.push({
          id: mappedResult.originalDocId,
          message: mappedResult.message,
          details: mappedResult.details,
        });
      } else if (mappedResult.status === "error") {
        mappingResults.failed.push({
          id: mappedResult.originalDocId,
          message: mappedResult.message,
          details: mappedResult.details,
        });
      }
    }

    if (shipmentsToSave.length === 0) {
      return res.status(200).json({
        message: "No new valid orders to save.",
        failedDocuments: mappingResults.failed,
        skippedDocuments: mappingResults.skipped,
      });
    }

    // Step 3: Save only the new shipments
    const savedShipments = await Shipment.insertMany(shipmentsToSave);
    mappingResults.saved = savedShipments.map((s) => s._id);

    // Final response
    res.status(201).json({
      message: `Operation completed. ${savedShipments.length} new shipments saved.`,
      summary: {
        savedCount: mappingResults.saved.length,
        skippedCount: mappingResults.skipped.length,
        failedCount: mappingResults.failed.length,
        warnedCount: mappingResults.warnings.length,
      },
      savedShipmentIds: mappingResults.saved,
      failedDocuments: mappingResults.failed,
      warnings: mappingResults.warnings,
      skippedDocuments: mappingResults.skipped,
    });
  } catch (error) {
    console.error("Error fetching, mapping, and saving orders:", error);
    res.status(500).json({
      message: "An internal server error occurred.",
      error: error.message,
    });
  }
};
