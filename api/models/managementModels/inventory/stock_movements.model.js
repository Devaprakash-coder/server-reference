'use strict';
const mongoose = require('mongoose'),
    Schema = mongoose.Schema;

const purchaseSchema = new Schema({
    purchase_order_id: String
    , purchase_order_number: String
    , quantity_before: Number
    , quantity_after: Number
})

const stockMovementSchema = new Schema({
    company_id: String
    , branch_id: String
    , location_id: String
    , movement_location: String
    , material_name: String
    , material_id: String
    , material_category_id: String
    , short_unit: String
    , unit: String
    , material_quantity: String
    , movement_action: String
    , movement_reason: String
    , from_orders: [purchaseSchema]
    , moved_on: Date
});

module.exports = mongoose.model('stock_movements', stockMovementSchema, 'stock_movements')