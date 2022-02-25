'use strict';
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const printerServerSchema = new Schema({
    name : String
    , assigned_ip: String
    , default_server: {
        type: Boolean
        , default: false
    }
})

const memberSchema = new Schema({
    branch_id: String
    , company_id: String
    , position_id: {
        type: Schema.Types.ObjectId, 
        ref: 'customer_meta'
    }
    , name: String
    , pin: Number
    , position: String
    , contact_number: String
    , created_at: {
        type: Date
        , default: Date.now
    }
    , status: {
        type: String
        , default: 'active'
    }
    , push_tokens: {
        type: Array
        , default: []
    }
    , tour_status: {
        type: String
        , default: 'new'
        /** Let the available options be [ new, done, skiped, inbetween] */
    }
    , assigned_server_printer_id: String
    , assigned_server_printer_name: String
    , assigned_server_printer_ip: String
    // , assigned_printer_server: {
    //     type: printerServerSchema
    // }
    /**
     * Note: tour_status helps to find where the user completed the tutorial or not
     * If Not take the appropriate action
     */
});

module.exports = mongoose.model('members_directory', memberSchema, 'members_directory');
