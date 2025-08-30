//Imports
const axios = require("axios");
const Order = require("../models/ordersRaw"); // Assuming the schema is in this file as you mentioned

const fetchAndStoreOrders = async (req, res) => {
  try {
    // Make the REST API call using axios
    let config = {
      method: "get",
      maxBodyLength: Infinity,
      url: `${process.env.SHOPIFY_STORE_URL}/admin/api/${process.env.API_VERSION}/orders.json?status=open`,
      headers: {
        "X-Shopify-Access-Token": process.env.ACCESS_TOKEN,
      },
    };

    const response = await axios.request(config);
    const orders = response.data.orders;

    if (!orders || orders.length === 0) {
      console.log("No orders found to save.");
      return res.status(200).json({ message: "No new orders to save." });
    }

    const savedOrders = [];
    const skippedOrders = [];

    // Use a for...of loop to handle async/await correctly within the loop
    for (const orderData of orders) {
      try {
        const existingOrder = await Order.findOne({ id: orderData.id });
        if (existingOrder) {
          console.log(`Order ${orderData.name} already exists. Skipping.`);
          skippedOrders.push(orderData.name);
          continue;
        }

        const newOrder = new Order({
          id: orderData.id,
          admin_graphql_api_id: orderData.admin_graphql_api_id,
          app_id: orderData.app_id,
          browser_ip: orderData.browser_ip,
          buyer_accepts_marketing: orderData.buyer_accepts_marketing,
          cancel_reason: orderData.cancel_reason,
          cancelled_at: orderData.cancelled_at,
          cart_token: orderData.cart_token,
          checkout_id: orderData.checkout_id,
          checkout_token: orderData.checkout_token,
          client_details: orderData.client_details,
          closed_at: orderData.closed_at,
          confirmation_number: orderData.confirmation_number,
          confirmed: orderData.confirmed,
          contact_email: orderData.contact_email,
          created_at: orderData.created_at,
          currency: orderData.currency,
          current_subtotal_price: orderData.current_subtotal_price,
          current_subtotal_price_set: orderData.current_subtotal_price_set,
          current_total_additional_fees_set:
            orderData.current_total_additional_fees_set,
          current_total_discounts: orderData.current_total_discounts,
          current_total_discounts_set: orderData.current_total_discounts_set,
          current_total_duties_set: orderData.current_total_duties_set,
          current_total_price: orderData.current_total_price,
          current_total_price_set: orderData.current_total_price_set,
          current_total_tax: orderData.current_total_tax,
          current_total_tax_set: orderData.current_total_tax_set,
          customer_locale: orderData.customer_locale,
          device_id: orderData.device_id,
          discount_codes: orderData.discount_codes,
          duties_included: orderData.duties_included,
          email: orderData.email,
          estimated_taxes: orderData.estimated_taxes,
          financial_status: orderData.financial_status,
          fulfillment_status: orderData.fulfillment_status,
          landing_site: orderData.landing_site,
          landing_site_ref: orderData.landing_site_ref,
          location_id: orderData.location_id,
          merchant_business_entity_id: orderData.merchant_business_entity_id,
          merchant_of_record_app_id: orderData.merchant_of_record_app_id,
          name: orderData.name,
          note: orderData.note,
          note_attributes: orderData.note_attributes,
          number: orderData.number,
          order_number: orderData.order_number,
          order_status_url: orderData.order_status_url,
          original_total_additional_fees_set:
            orderData.original_total_additional_fees_set,
          original_total_duties_set: orderData.original_total_duties_set,
          payment_gateway_names: orderData.payment_gateway_names,
          phone: orderData.phone,
          po_number: orderData.po_number,
          presentment_currency: orderData.presentment_currency,
          processed_at: orderData.processed_at,
          reference: orderData.reference,
          referring_site: orderData.referring_site,
          source_identifier: orderData.source_identifier,
          source_name: orderData.source_name,
          source_url: orderData.source_url,
          subtotal_price: orderData.subtotal_price,
          subtotal_price_set: orderData.subtotal_price_set,
          tags: orderData.tags,
          tax_exempt: orderData.tax_exempt,
          tax_lines: orderData.tax_lines,
          taxes_included: orderData.taxes_included,
          test: orderData.test,
          token: orderData.token,
          total_cash_rounding_payment_adjustment_set:
            orderData.total_cash_rounding_payment_adjustment_set,
          total_cash_rounding_refund_adjustment_set:
            orderData.total_cash_rounding_refund_adjustment_set,
          total_discounts: orderData.total_discounts,
          total_discounts_set: orderData.total_discounts_set,
          total_line_items_price: orderData.total_line_items_price,
          total_line_items_price_set: orderData.total_line_items_price_set,
          total_outstanding: orderData.total_outstanding,
          total_price: orderData.total_price,
          total_price_set: orderData.total_price_set,
          total_shipping_price_set: orderData.total_shipping_price_set,
          total_tax: orderData.total_tax,
          total_tax_set: orderData.total_tax_set,
          total_tip_received: orderData.total_tip_received,
          total_weight: orderData.total_weight,
          updated_at: orderData.updated_at,
          user_id: orderData.user_id,
          billing_address: orderData.billing_address,
          customer: orderData.customer,
          discount_applications: orderData.discount_applications,
          fulfillments: orderData.fulfillments,
          line_items: orderData.line_items,
          payment_terms: orderData.payment_terms,
          refunds: orderData.refunds,
          shipping_address: orderData.shipping_address,
          shipping_lines: orderData.shipping_lines,
        });

        // Save the order to the database
        await newOrder.save();
        console.log(`Order ${newOrder.name} saved successfully.`);
        savedOrders.push(newOrder.name);
      } catch (saveError) {
        if (saveError.code === 11000) {
          console.log(`Order ${orderData.name} already exists. Skipping.`);
          skippedOrders.push(orderData.name);
        } else {
          console.error(`Error saving order ${orderData.name}:`, saveError);
          // Continue to the next order even if one fails
        }
      }
    }

    console.log("All orders have been processed.");
    return res.status(200).json({
      message: "Orders processed successfully.",
      saved: savedOrders,
      skipped: skippedOrders,
    });
  } catch (error) {
    console.error("An error occurred:", error);
    return res.status(500).json({ error: "Failed to fetch and store orders." });
  }
};

module.exports = {
  fetchAndStoreOrders,
};
