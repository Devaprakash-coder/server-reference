'use strict';

const mongoose = require('mongoose');
const Schema  = mongoose.Schema;

const optionSchema = new Schema({
    value: String
});

const characteristicSchema = new Schema({
    branch_id: String
    , company_id: String
    , name: String
    , unit: String
    , short_unit: String
    , options: [optionSchema]
});

module.exports = mongoose.model('inventory_characteristics', characteristicSchema, 'inventory_characteristics');