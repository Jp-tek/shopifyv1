// controllers/updateAndSyncOrders.js
const axios = require("axios");
const Order = require("../models/ordersRaw");

/**
 * Standardizes ISO 8601 date strings to a consistent UTC format.
 * This is crucial for comparing timestamps that may have different
 * timezone offsets but represent the same moment in time.
 * @param {object} obj The object to traverse and standardize timestamps within.
 */
const standardizeTimestamps = (obj) => {
    if (!obj || typeof obj !== 'object') {
        return;
    }

    const dateRegex = /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/;
    
    for (const key in obj) {
        if (typeof obj[key] === 'string' && dateRegex.test(obj[key])) {
            try {
                const date = new Date(obj[key]);
                if (!isNaN(date.getTime())) {
                    obj[key] = date.toISOString();
                }
            } catch (e) {
                // Ignore parsing errors
            }
        } else if (typeof obj[key] === 'object' && obj[key] !== null) {
            standardizeTimestamps(obj[key]);
        }
    }
};

/**
 * A robust recursive deep comparison function for two objects.
 * It handles dates, arrays, and nested objects and is not
 * affected by property order.
 * @param {object} obj1 The first object to compare.
 * @param {object} obj2 The second object to compare.
 * @returns {boolean} True if the objects are identical in content, false otherwise.
 */
const areObjectsIdentical = (obj1, obj2) => {
    // Strict comparison for non-object types and primitives
    if (obj1 === obj2) return true;
    
    // If they are not both objects, they are different
    if (typeof obj1 !== 'object' || typeof obj2 !== 'object' || obj1 === null || obj2 === null) {
        return false;
    }

    // Handle Date objects specifically
    if (obj1 instanceof Date && obj2 instanceof Date) {
        return obj1.getTime() === obj2.getTime();
    }
    
    // Handle arrays by comparing their sorted, stringified elements
    if (Array.isArray(obj1) && Array.isArray(obj2)) {
        if (obj1.length !== obj2.length) return false;
        
        const sorted1 = obj1.map(item => JSON.stringify(item)).sort();
        const sorted2 = obj2.map(item => JSON.stringify(item)).sort();
        
        return JSON.stringify(sorted1) === JSON.stringify(sorted2);
    }
    
    // Handle plain objects
    const keys1 = Object.keys(obj1);
    const keys2 = Object.keys(obj2);

    // If key counts differ, they are not identical
    if (keys1.length !== keys2.length) {
        return false;
    }

    // Recursively compare all keys
    for (const key of keys1) {
        if (!keys2.includes(key) || !areObjectsIdentical(obj1[key], obj2[key])) {
            return false;
        }
    }

    return true;
};

const updateAndSyncOrders = async (req, res) => {
    try {
        const config = {
            method: "get",
            url: `${process.env.SHOPIFY_STORE_URL}/admin/api/${process.env.API_VERSION}/orders.json?status=open`,
            headers: {
                "X-Shopify-Access-Token": process.env.ACCESS_TOKEN,
            },
        };

        const apiResponse = await axios.request(config);
        const apiOrders = apiResponse.data.orders;

        if (!apiOrders || apiOrders.length === 0) {
            return res.status(200).json({ message: "No open orders found in Shopify to sync." });
        }

        const syncResults = {
            updatedOrders: [],
            newOrders: [],
            unchangedOrders: [],
            archivedOrders: [],
        };
        const processedApiIds = new Set();
        const dbOrders = await Order.find({});
        const dbOrderMap = new Map(dbOrders.map(order => [order.id, order.toObject()]));
        
        for (const apiOrder of apiOrders) {
            processedApiIds.add(apiOrder.id);
            const dbOrder = dbOrderMap.get(apiOrder.id);
            
            // Create a copy of the API order for comparison
            const standardizedApiOrder = JSON.parse(JSON.stringify(apiOrder));
            standardizeTimestamps(standardizedApiOrder);

            if (dbOrder) {
                // Create a copy of the DB order and standardize for comparison
                const standardizedDbOrder = JSON.parse(JSON.stringify(dbOrder));
                standardizeTimestamps(standardizedDbOrder);

                if (areObjectsIdentical(standardizedApiOrder, standardizedDbOrder)) {
                    syncResults.unchangedOrders.push({
                        orderId: apiOrder.id,
                        orderName: apiOrder.name
                    });
                    continue; // Skip the update operation
                }
            }

            // If the order is new or has changes, perform the upsert
            const updatedOrder = await Order.findOneAndUpdate(
                { id: apiOrder.id },
                apiOrder,
                { new: true, upsert: true, runValidators: true }
            );

            if (dbOrder) {
                syncResults.updatedOrders.push({
                    orderId: apiOrder.id,
                    orderName: apiOrder.name
                });
            } else {
                syncResults.newOrders.push({
                    orderId: apiOrder.id,
                    orderName: apiOrder.name
                });
            }
        }
        
        for (const dbOrder of dbOrders) {
            if (!processedApiIds.has(dbOrder.id)) {
                syncResults.archivedOrders.push({
                    orderId: dbOrder.id,
                    orderName: dbOrder.name
                });
            }
        }

        return res.status(200).json({
            message: "Synchronization complete.",
            details: syncResults,
        });

    } catch (error) {
        console.error("An error occurred during synchronization:", error);
        return res.status(500).json({ error: "Failed to sync orders with the database." });
    }
};

module.exports = {
    updateAndSyncOrders,
};