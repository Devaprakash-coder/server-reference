'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const tableSchema = new Schema({
    company_id: String
    , branch_id: String
    , floor_id: String
    , name: String
    , table_prefix: String
    , floor_name: String
    , print: {type: String, default: "inactive"}
    , table_members: {
        type: Number,
        default: 0
    }
    , total_members: {
        type: Number,
        default: 0
    }
    , table_amount: {
        type: Number,
        default: 0
    }
    , total_amount: {
        type: Number,
        default: 0
    }
    , members: {
        type: [{
            type: Schema.Types.ObjectId, 
            ref: 'customer_directory'
        }]
        , default: []
    }
    , table_status: {
        type: String,
        default: 'active'
    }
    , merged_with: []
    , merged_to: []
    , parent_table: {
        type: Boolean,
        default: false
    }
    , parent_of : []
    , child_table: {
        type: Boolean,
        default: false
    }
    , child_of : []
    , session_started_at: {
        type: Date
        // default: Date.now
    }
    , has_alert: {
        type: Boolean,
        default: false
    }
    , mobile_order: {
        type: Boolean,
        default: false
    }
    , session_status: {
        type: String,
        default: 'inactive'
    }
    // Extra data for Dinamic linked
    , table_order_status: String
    , dinamic_status : String
    , qr_count: Number
    , nfc_count: Number
    , access_code: String
    , table_color: String
});

module.exports = mongoose.model('tables', tableSchema)