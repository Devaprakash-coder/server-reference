'use strict';
const mongoose = require('mongoose'),
    Schema = mongoose.Schema;

const stockMovementReasonSchema = new Schema({
    company_id: String
    , branch_id: String
    , title: String
    , action: String
});

module.exports = mongoose.model('stock_movement_reasons', stockMovementReasonSchema, 'stock_movement_reasons')