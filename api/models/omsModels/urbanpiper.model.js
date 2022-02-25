'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const urbanpiper = new Schema({
    request:  {
        "type": "Mixed"
      }
    , response:  {
        "type": "Mixed"
      },
    request_type: String,
    branch_id:{
      "type": String
    },
    brand_id:{
      "type": String, default:null
    }

},{timestamps:true})
module.exports = mongoose.model('urbanpiper', urbanpiper);