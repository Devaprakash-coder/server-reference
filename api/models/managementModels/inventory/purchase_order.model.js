'use strict';

const mongoose = require('mongoose'),
    Schema = mongoose.Schema;

const materialSchema = new Schema({
    material_id: String
    , material_category_id: String
    , material_name: String
    , material_code: String
    , agreed_rate: Number
    , received_rate: Number
    , material_unit: String
    , short_unit: String
    , quantity: Number
    , received_quantity: Number
    , received_at: Date
    , status: {
        type: String
        , default: 'pending'
    }
});

const purchaseOrderSchema = new Schema({
    company_id: String
    , branch_id: String
    , order_id_prefix: String
    , order_id_suffix: String
    , purchase_order_id: String
    , receipt_id: String
    , supplier_id: String
    , supplier_name: String
    , supplier_contact: String
    , purchase_issued_date: {
        type: Date
        , default: Date.now
    }
    , expected_delivery_date: Date
    , received_delivery_date: Date
    , placed_material_list: [materialSchema]
    , delivery_address: String
    , order_status: {
        type: String
        , default: 'pending'
    }
});

module.exports = mongoose.model('purchase_orders', purchaseOrderSchema, 'purchase_orders')