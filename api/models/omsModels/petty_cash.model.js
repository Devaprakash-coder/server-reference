'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const pettyCashSchema = new Schema({
    type: String,
    status : {
        type: String,
        default: 'active'
    },
    created_on: {
        type: Date,
        default: Date.now
    }
})

module.exports = mongoose.model('petty_cash', pettyCashSchema)