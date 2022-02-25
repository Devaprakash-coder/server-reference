'use strict'
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ratingSchema = new Schema({
    name: String
    , value: Number
});

const feedbackSchema = new Schema({
    feedback_list: [ratingSchema]
    , user_name: String
    , user_id: String
    , branch_id: String
    , privacy: {
        type: Boolean
        , default: false
    }
    , created_at: {
        type: Date
    }
    , updated_at: { 
        type: Date
        , default: Date.now
    }
});

module.exports = mongoose.model('feedback', feedbackSchema);