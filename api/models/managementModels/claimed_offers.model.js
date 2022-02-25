const mongoose = require('mongoose');
const Schema  = mongoose.Schema;

const claimedOfferSchema = new Schema({
    company_id: String
    , branch_id: String
    , offer_id: String
    , offer_title: String
    , generated_coupon: String
    , reward_points: Number
    , minimum_bill_value: Number
    , max_discount_amount: Number
    , offer_description: String
    , offer_type: String
    , offer_value: Number
    , claim_status: String
    , claimed_by: String
    , claimed_at: Date
    , applied_for_order: String
    , applied_at: Date
});

module.exports = mongoose.model('claimed_offers', claimedOfferSchema)