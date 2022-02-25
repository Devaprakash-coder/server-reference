'use strict';

const mongoose = require('mongoose'),
    Schema  = mongoose.Schema;

const stockSchema = new Schema({
    purchase_order_id: String
    , purchase_order_number: String
    , available_quantity: Number
    , stock_quantity: Number
    , purchase_received_date: Date
})

const materialStockSchema = new Schema({
    company_id: String
    , branch_id: String
    , material_id: String
    , material_category_id: String
    , current_stocks: [ stockSchema ]
});

module.exports = mongoose.model('material_stocks', materialStockSchema, 'material_stocks');