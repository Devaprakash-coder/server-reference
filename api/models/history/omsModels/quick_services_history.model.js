'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const serviceSchema = new Schema({
    name: String
    , quantity: Number
    , price: Number
    , service_status: String
    , caller_id: String
    , caller_name: String
    , free_service: Boolean
    , item_id: String
    , called_on: Date
})

const quickServicesHistorySchema = new Schema({
    branch_id: String
    , order_id: String
    , order_number: String
    , company_id: String
    , services: [serviceSchema]
    , takeaway_id: String
    , table_id: String
    , delivery_id: String
});

module.exports = mongoose.model('quick_services_history', quickServicesHistorySchema);