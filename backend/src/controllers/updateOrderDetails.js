// controllers/updateOrderDetails.js
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
            // Convert to a Date object and then back to a standardized ISO string
            try {
                const date = new Date(obj[key]);
                if (!isNaN(date.getTime())) { // Check if it's a valid date
                    obj[key] = date.toISOString();
                }
            } catch (e) {
                // Ignore parsing errors and move on
            }
        } else if (typeof obj[key] === 'object' && obj[key] !== null) {
            // Recursively process nested objects and arrays
            standardizeTimestamps(obj[key]);
        }
    }
};


/**
 * Recursively compares two objects and returns the differences,
 * but only for fields that are defined in the Mongoose schema.
 * @param {object} apiData The object from the API.
 * @param {object} dbData The object from the database.
 * @param {object} schema The Mongoose schema to check against.
 * @returns {object} An object containing only the differing key-value pairs.
 */
const findDifferences = (apiData, dbData, schema) => {
    const changes = {};
    const schemaPaths = schema.paths;

    for (const key of Object.keys(schemaPaths)) {
        if (key === '__v' || key === '_id') {
            continue;
        }

        const apiValue = apiData[key];
        const dbValue = dbData[key];

        const apiHasKey = key in apiData;
        const dbHasKey = key in dbData;

        if (apiHasKey !== dbHasKey) {
            changes[key] = {
                oldValue: dbValue,
                newValue: apiValue
            };
            continue;
        }
        if (!apiHasKey) {
            continue;
        }

        if (apiValue === null || dbValue === null) {
            if (apiValue !== dbValue) {
                changes[key] = {
                    oldValue: dbValue,
                    newValue: apiValue
                };
            }
            continue;
        }

        const schemaType = schemaPaths[key];

        if (schemaType.schema) {
            const nestedChanges = findDifferences(apiValue, dbValue, schemaType.schema);
            if (Object.keys(nestedChanges).length > 0) {
                changes[key] = nestedChanges;
            }
        }
        else if (Array.isArray(apiValue) && Array.isArray(dbValue)) {
            if (apiValue.length !== dbValue.length) {
                changes[key] = { oldValue: dbValue, newValue: apiValue };
                continue;
            }
            
            const sortedApiValue = apiValue.map(item => JSON.stringify(item)).sort();
            const sortedDbValue = dbValue.map(item => JSON.stringify(item)).sort();
            
            let arraysAreDifferent = false;
            for (let i = 0; i < sortedApiValue.length; i++) {
                if (sortedApiValue[i] !== sortedDbValue[i]) {
                    arraysAreDifferent = true;
                    break;
                }
            }

            if (arraysAreDifferent) {
                changes[key] = {
                    oldValue: dbValue,
                    newValue: apiValue,
                };
            }
        }
        else if (apiValue !== dbValue) {
            changes[key] = {
                oldValue: dbValue,
                newValue: apiValue,
            };
        }
    }

    return changes;
};

const updateOrders = async (req, res) => {
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
            return res.status(200).json({ message: "No orders found to process." });
        }

        const dbOrders = await Order.find({});
        const comparisonResults = [];
        const processedApiIds = new Set();
        
        const dbOrderMap = new Map(dbOrders.map(order => [order.id, order.toObject()]));
        
        for (const apiOrder of apiOrders) {
            processedApiIds.add(apiOrder.id);
            const dbOrder = dbOrderMap.get(apiOrder.id);

            if (dbOrder) {
                // Create copies to avoid mutating original data
                const standardizedApiOrder = JSON.parse(JSON.stringify(apiOrder));
                const standardizedDbOrder = JSON.parse(JSON.stringify(dbOrder));
                
                // Standardize timestamps for accurate comparison
                standardizeTimestamps(standardizedApiOrder);
                standardizeTimestamps(standardizedDbOrder);

                const changes = {
                    orderId: apiOrder.id,
                    orderName: apiOrder.name,
                    diff: findDifferences(standardizedApiOrder, standardizedDbOrder, Order.schema)
                };
                
                if (Object.keys(changes.diff).length > 0) {
                    comparisonResults.push(changes);
                }
            } else {
                comparisonResults.push({
                    orderId: apiOrder.id,
                    orderName: apiOrder.name,
                    diff: "New Order"
                });
            }
        }

        for (const dbOrder of dbOrders) {
            if (!processedApiIds.has(dbOrder.id)) {
                comparisonResults.push({
                    orderId: dbOrder.id,
                    orderName: dbOrder.name,
                    diff: "Order archived or no longer in API response"
                });
            }
        }

        return res.status(200).json({
            message: "Order comparison complete.",
            comparisonData: comparisonResults,
        });

    } catch (error) {
        console.error("An error occurred:", error);
        return res.status(500).json({ error: "Failed to compare orders." });
    }
};

module.exports = {
    updateOrders,
};