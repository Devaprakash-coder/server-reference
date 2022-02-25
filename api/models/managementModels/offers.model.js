'use strict';
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const offersSchema = new Schema({
    company_id: String
    , branch_id: String
    , title: String
    , req_reward_points: Number
    , minimum_bill_value: {
        type: Number
        , default: 0
    }
    , max_discount_amount: Number
    , offer_valid_from: Date
    , offer_valid_upto: Date
    , offer_description: String
    , offer_type: String
    , offer_value: Number
    , product_to_buy_id: String
    , product_to_buy: String
    , product_to_buy_quantity: Number
    , product_type: String
    , free_product_id: String
    , free_product: String
    , free_product_quantity: Number
    , created_at: {
        type: Date
        , default: Date.now
    }
    , status: {
        type: String
        , default: 'active'
    }
});

module.exports =  mongoose.model('current_offers' , offersSchema);