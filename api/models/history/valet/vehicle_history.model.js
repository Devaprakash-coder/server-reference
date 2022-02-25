'use strict'

const mongoose = require('mongoose')
const Schema = mongoose.Schema

const userSchema = new Schema({
    name: String,
    contact_number: String,
    email: String
})

const historyValetSchema = new Schema({
    branch_id: String,
    company_id: String,
    valet_id: String, // This will comes from DMS
    session_started_at: {
        type: Date,
        default: Date.now()
    },
    card_color: String,
    session_ended_at: Date,
    vehicle_status: String,
    serial_number:  String,
    delivery_time: Date,
    last_action_time: {
        type: Date,
        default: Date.now()
    },
    vehicle_delivery_time: String,
    user_details: userSchema
})

module.exports = mongoose.model('valet_vehicle_history', historyValetSchema, 'valet_vehicle_history')