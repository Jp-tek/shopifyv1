const mongoose = require('mongoose');

const shipmentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  order: {
    type: String,
    required: true,
  },
  phone: {
    type: [String],
    required: true,
  },
  add: {
    type: String,
    required: true,
  },
  pin: {
    type: Number,
    required: true,
  },
  pickup_location: {
    type: String,
    required: true,
  },
  address_type: {
    type: String,
    enum: ['home', 'office'],
  },
  ewbn: String,
  hsn_code: String,
  shipping_mode: {
    type: String,
    enum: ['Surface', 'Express'],
  },
  seller_inv: String,
  city: String,
  weight: Number,
  return_name: String,
  return_address: String,
  return_city: String,
  return_phone: [String],
  return_state: String,
  return_country: String,
  return_pin: Number,
  seller_name: String,
  fragile_shipment: Boolean,
  shipment_height: Number,
  shipment_width: Number,
  shipment_length: Number,
  cod_amount: Number,
  products_desc: String,
  state: String,
  dangerous_good: Boolean,
  waybill: String,
  total_amount: Number,
  seller_add: String,
  country: String,
  plastic_packaging: Boolean,
  quantity: String,
});

const Shipment = mongoose.model('Shipment', shipmentSchema);

module.exports = Shipment;