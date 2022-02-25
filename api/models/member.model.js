// remove once implemented with the new one inside management folder
'use strict';
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const memberSchema = new Schema({
    branch_id: String,
    company_id: String,
    position_id: String,
    name: String,
    pin: Number,
    position: String,
    created_at: {
        type: Date,
        default: Date.now
    },
    status: {
        type: String,
        default: 'active'
    }
});

module.exports = mongoose.model('Members', memberSchema, 'Members');
