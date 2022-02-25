'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const tableSchema = new Schema({
    company_id: String
    , branch_id: String
    , floor_id: String
    , table_id: String
    , order_number: String
    , name: String
    , table_prefix: String
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
    , session_status: {
        type: String,
        default: 'inactive'
    }
});

module.exports = mongoose.model('history_tables', tableSchema)