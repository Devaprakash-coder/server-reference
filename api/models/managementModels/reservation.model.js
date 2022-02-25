'use strict';
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const reservationSchema = new Schema({
    branch_id: String,
    company_id: String,
    reserver_id : String,
    name: String,
    contact_number: String,
    email: String,
    occasion : String,
    additional_requirements: String,
    date: String,
    time: String,
    reserved_seats: String,
    status: {
        type: String,
        default: "active"
    }
})

module.exports = mongoose.model('reservations', reservationSchema);