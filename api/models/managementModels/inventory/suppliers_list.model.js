'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const supplierListSchema = new Schema({
    company_id: String
    , branch_id: String
    , name: String
    , contact: String
    , address: String
    , po_prefix: String
    , material_count: { //for future updates
        type: Number
        , default: 0
    }
});

module.exports = mongoose.model('suppliers_list', supplierListSchema, 'suppliers_list');