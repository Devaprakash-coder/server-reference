'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const paymentHistorySchema = new Schema({
    branch_id: String
    , company_id: String
    , payment_type: {
        type: String
        , default: 'Cash'
    }
    , bill_id: String
    , amount_paid : Number
    , paid_at: {
        type: Date
        , default: Date.now
    }
    , payment_status: String
    // , customer_type: {
    //     type: String
    //     , default: 'new'
    // }
});

module.exports = mongoose.model('history_payments', paymentHistorySchema);