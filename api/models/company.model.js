'use strict';
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const reasonSchema = new Schema({
    reason: String,
    percentage: String,
    status: {
        type: String,
        default: 'active'
    }
});

const stockSchema = new Schema({
    reason: String,
    status : {
        type: String,
        default: 'active'
    }
})

const CompanySchema = new Schema({
    name: String,
    sub_heading: String,
    TIN: String,
    VATIN: String,
    phone: String,
    currency: String,
    service_charge: {
        type: Number,
        default: 0
    },
    customer_editable_sc: {
        type: Boolean,
        default: false
    },
    email: String,
    website: String,
    receipt_message: String,
    font_size: String,
    logo_url: String,
    address: String,
    discount_reasons: [reasonSchema],
    stock_movement_reasons:[stockSchema],
    branch_count: {
        type: Number,
        default: 0
    }
});

module.exports = mongoose.model('Company', CompanySchema, 'company_details');