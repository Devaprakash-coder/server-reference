'use strict';
const mongoose = require('mongoose');

const zipcodeSchema = new mongoose.Schema({
  display: { type: String },
  value: { type: String }
}, { _id : false });

const categoriesSchema = new mongoose.Schema({
  category_id: { type: String },
  status: { type: String }
}, { _id : false });

const phoneSchema = new mongoose.Schema({
  number: { type: String }
}, { _id : false });

const emailSchema = new mongoose.Schema({
  email: { type: String }
}, { _id : false });

const platformData = new mongoose.Schema({
  name: { type: String },
  url: { type: String },
  platform_store_id: { type: String },
});

const sessionSchema = new mongoose.Schema({
	start_time: { type: String },
	end_time: { type: String }
}, { _id : false });

const availabilitySchema = new mongoose.Schema({
  day: { type: String , lowercase: true , trim: true },
  status: { type: Boolean, enum: [true, false], default: true },
	slots: [ sessionSchema ]
}, { _id : false });

const delivery_brand = new mongoose.Schema({
  branch_id: { type: String },
  company_id: { type: String },
  urban_id : { type: String, default:0 },
  name: { type: String },
  city: { type: String },
  address: { type: String },
  zip_codes: [ zipcodeSchema ],
  geo_longitude: { type: Number },
  geo_latitude: { type: Number },
  min_pickup_time: { type: Number },
  min_order_value: { type: Number },
  min_delivery_time: { type: Number },
  contact_phone: { type: String },
  notification_phones: [ phoneSchema ],
  notification_emails: [ emailSchema ],
  platform_data:[ platformData ],
  timings: [ availabilitySchema ],
  active: { type: Boolean, default:"true" },
  ordering_enabled: { type: Boolean, default: true },
  included_platforms:{ type: Array, default: [] },
  categories:{type:[String],default:[]}
},
{timestamps: true});

module.exports = mongoose.model('delivery_brand', delivery_brand);