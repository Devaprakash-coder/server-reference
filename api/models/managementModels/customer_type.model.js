'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const CustomerType = new Schema({
    company_id: String,
    type : String,
    type_status: {
        type : String,
        default: 'active'
    },
    created_on : {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('customer_type', CustomerType) 