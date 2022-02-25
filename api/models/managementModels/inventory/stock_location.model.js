'use strict';
const mongoose = require('mongoose'),
    Schema = mongoose.Schema;

const stockLocationSchema = new Schema({
    company_id: String
    , branch_id: String
    , title: String
});

module.exports = mongoose.model('stock_locations', stockLocationSchema, 'stock_locations')