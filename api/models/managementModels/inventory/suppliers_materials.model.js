'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const materialSchema = new Schema({
    material_name: String
    , material_id: String
    , material_category_id: String
    , material_code: String
    , aggregate_rate: String
    , short_unit: String
    , material_unit: String
});

const SupplierMaterialSchema = new Schema({
    branch_id: String
    , company_id: String
    , supplier_name: String
    , supplier_id: String
    , supplier_po_prefix: String
    , materials: [materialSchema]
});

module.exports = mongoose.model('suppliers_materials', SupplierMaterialSchema, 'suppliers_materials');