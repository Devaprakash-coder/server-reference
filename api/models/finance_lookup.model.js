'use strict'

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const tenderTypeSchema = new Schema({
    tender_type: String,
    status: {
        type: String,
        default: 'active'
    },
    count: {
        type: Number
        , default: 0
    },
    total_cost: {
        type: Number
        , default: 0
    }
});

const taxRateSchema = new Schema({
    tax_type : String,
    percentage: Number,
    status: {
        type: String,
        default: 'active'
    }
});

const pettyCashReasonSchema = new Schema({
    reason: String,
    status: {
        type: String,
        default: 'active'
    }
});

//changes on 25th september
//changed finacial lookups for branches (added branch_id along)
const financeLookupSchema = new Schema({
    company_id : String,
    branch_id: String,
    tender_types: [tenderTypeSchema],
    tax_rates: [taxRateSchema],
    petty_cash_reasons: [pettyCashReasonSchema]
});

module.exports = mongoose.model('FinanceLookUp', financeLookupSchema, 'finance_lookup');