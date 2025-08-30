const mongoose = require("mongoose");
const { Schema } = mongoose;

// Sub-schema for the financial money objects
const MoneySchema = new Schema(
  {
    amount: String,
    currency_code: String,
  },
  { _id: false }
);

// Sub-schema for price sets
const PriceSetSchema = new Schema(
  {
    shop_money: MoneySchema,
    presentment_money: MoneySchema,
  },
  { _id: false }
);

// Sub-schema for client details
const ClientDetailsSchema = new Schema(
  {
    accept_language: String,
    browser_height: Number,
    browser_ip: String,
    browser_width: Number,
    session_hash: String,
    user_agent: String,
  },
  { _id: false }
);

// Sub-schema for addresses
const AddressSchema = new Schema(
  {
    first_name: String,
    address1: String,
    phone: String,
    city: String,
    zip: String,
    province: String,
    country: String,
    last_name: String,
    address2: String,
    company: String,
    latitude: Number,
    longitude: Number,
    name: String,
    country_code: String,
    province_code: String,
  },
  { _id: false }
);

// Sub-schema for a single tax line
const TaxLineSchema = new Schema(
  {
    price: String,
    rate: Number,
    title: String,
    price_set: PriceSetSchema,
    channel_liable: Boolean,
  },
  { _id: false }
);

const EmailMarketingConsentSchema = new Schema(
  {
    state: String,
    opt_in_level: String,
    consent_updated_at: Date,
  },
  { _id: false }
);
// Sub-schema for SMS marketing consent
const SMSMarketingConsentSchema = new Schema(
  {
    state: String,
    opt_in_level: String,
    consent_updated_at: Date,
    consent_collected_from: String,
  },
  { _id: false }
);

// Sub-schema for customer information
const CustomerSchema = new Schema(
  {
    id: Number,
    created_at: Date,
    updated_at: Date,
    first_name: String,
    last_name: String,
    state: String,
    note: String,
    verified_email: Boolean,
    multipass_identifier: String,
    tax_exempt: Boolean,
    email_marketing_consent: EmailMarketingConsentSchema,
    sms_marketing_consent: SMSMarketingConsentSchema,
    tags: String,
    email: String,
    phone: String,
    currency: String,
    tax_exemptions: [String],
    admin_graphql_api_id: String,
    default_address: AddressSchema,
  },
  { _id: false }
);

// Sub-schema for a line item
const LineItemSchema = new Schema(
  {
    id: Number,
    admin_graphql_api_id: String,
    attributed_staffs: Array,
    current_quantity: Number,
    fulfillable_quantity: Number,
    fulfillment_service: String,
    fulfillment_status: String,
    gift_card: Boolean,
    grams: Number,
    name: String,
    price: String,
    price_set: PriceSetSchema,
    product_exists: Boolean,
    product_id: Number,
    properties: Array,
    quantity: Number,
    requires_shipping: Boolean,
    sku: String,
    taxable: Boolean,
    title: String,
    total_discount: String,
    total_discount_set: PriceSetSchema,
    variant_id: Number,
    variant_inventory_management: String,
    variant_title: String,
    vendor: String,
    tax_lines: [TaxLineSchema],
    duties: Array,
    discount_allocations: Array,
  },
  { _id: false }
);

// Sub-schema for a refund transaction
const RefundTransactionSchema = new Schema(
  {
    id: Number,
    admin_graphql_api_id: String,
    amount: String,
    authorization: String,
    created_at: Date,
    currency: String,
    device_id: Number,
    error_code: String,
    gateway: String,
    kind: String,
    location_id: Number,
    message: String,
    order_id: Number,
    parent_id: Number,
    payment_id: String,
    processed_at: Date,
    receipt: Object,
    source_name: String,
    status: String,
    test: Boolean,
    user_id: Number,
  },
  { _id: false }
);

// Sub-schema for refund line items
const RefundLineItemSchema = new Schema(
  {
    id: Number,
    line_item_id: Number,
    location_id: Number,
    quantity: Number,
    restock_type: String,
    subtotal: Number,
    subtotal_set: PriceSetSchema,
    total_tax: Number,
    total_tax_set: PriceSetSchema,
    line_item: LineItemSchema,
  },
  { _id: false }
);

// Sub-schema for a refund
const RefundSchema = new Schema(
  {
    id: Number,
    admin_graphql_api_id: String,
    created_at: Date,
    note: String,
    order_id: Number,
    processed_at: Date,
    restock: Boolean,
    total_duties_set: PriceSetSchema,
    user_id: Number,
    order_adjustments: Array,
    transactions: [RefundTransactionSchema],
    refund_line_items: [RefundLineItemSchema],
    duties: Array,
  },
  { _id: false }
);

// Sub-schema for a fulfillment
const FulfillmentSchema = new Schema(
  {
    id: Number,
    admin_graphql_api_id: String,
    created_at: Date,
    location_id: Number,
    name: String,
    order_id: Number,
    origin_address: Object,
    receipt: Object,
    service: String,
    shipment_status: String,
    status: String,
    tracking_company: String,
    tracking_number: String,
    tracking_numbers: [String],
    tracking_url: String,
    tracking_urls: [String],
    updated_at: Date,
    line_items: [LineItemSchema],
  },
  { _id: false }
);

// The main Order schema
const OrderSchema = new Schema({
  id: { type: Number, required: true, unique: true },
  admin_graphql_api_id: String,
  app_id: Number,
  browser_ip: String,
  buyer_accepts_marketing: Boolean,
  cancel_reason: String,
  cancelled_at: Date,
  cart_token: String,
  checkout_id: Number,
  checkout_token: String,
  client_details: ClientDetailsSchema,
  closed_at: Date,
  confirmation_number: String,
  confirmed: Boolean,
  contact_email: String,
  created_at: Date,
  currency: String,
  current_subtotal_price: String,
  current_subtotal_price_set: PriceSetSchema,
  current_total_additional_fees_set: PriceSetSchema,
  current_total_discounts: String,
  current_total_discounts_set: PriceSetSchema,
  current_total_duties_set: PriceSetSchema,
  current_total_price: String,
  current_total_price_set: PriceSetSchema,
  current_total_tax: String,
  current_total_tax_set: PriceSetSchema,
  customer_locale: String,
  device_id: Number,
  discount_codes: Array,
  duties_included: Boolean,
  email: String,
  estimated_taxes: Boolean,
  financial_status: String,
  fulfillment_status: String,
  landing_site: String,
  landing_site_ref: String,
  location_id: Number,
  merchant_business_entity_id: String,
  merchant_of_record_app_id: String,
  name: String,
  note: String,
  note_attributes: Array,
  number: Number,
  order_number: Number,
  order_status_url: String,
  original_total_additional_fees_set: PriceSetSchema,
  original_total_duties_set: PriceSetSchema,
  payment_gateway_names: [String],
  phone: String,
  po_number: String,
  presentment_currency: String,
  processed_at: Date,
  reference: String,
  referring_site: String,
  source_identifier: String,
  source_name: String,
  source_url: String,
  subtotal_price: String,
  subtotal_price_set: PriceSetSchema,
  tags: String,
  tax_exempt: Boolean,
  tax_lines: [TaxLineSchema],
  taxes_included: Boolean,
  test: Boolean,
  token: String,
  total_cash_rounding_payment_adjustment_set: PriceSetSchema,
  total_cash_rounding_refund_adjustment_set: PriceSetSchema,
  total_discounts: String,
  total_discounts_set: PriceSetSchema,
  total_line_items_price: String,
  total_line_items_price_set: PriceSetSchema,
  total_outstanding: String,
  total_price: String,
  total_price_set: PriceSetSchema,
  total_shipping_price_set: PriceSetSchema,
  total_tax: String,
  total_tax_set: PriceSetSchema,
  total_tip_received: String,
  total_weight: Number,
  updated_at: Date,
  user_id: Number,
  billing_address: AddressSchema,
  customer: CustomerSchema,
  discount_applications: Array,
  fulfillments: [FulfillmentSchema],
  line_items: [LineItemSchema],
  payment_terms: String,
  refunds: [RefundSchema],
  shipping_address: AddressSchema,
  shipping_lines: Array,
});

// Export the model
const Order = mongoose.model("Order", OrderSchema);
module.exports = Order;
