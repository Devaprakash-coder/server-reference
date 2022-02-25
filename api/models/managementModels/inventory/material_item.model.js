"use strict";
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const addonSchema = new Schema({
	char_id: String,
	char_name: String,
	char_unit: String,
	value: String
});

const materialItemSchema = new Schema({
	company_id: String
	, branch_id: String
	, category_id: String
	, category_name: String
	, name: String
	, skucode: String
	, imageUrl: {
		type: String,
		default: ''
	}
	, tags: {
		type: String
		, default: ''
	}
	, material_code: String
	, min_stock: String
	, shelf_life: String
	, unit: String
	, short_unit: String
	, applied_addons: Boolean
	, addons: [addonSchema]
	, rank: Number
	, last_updated_month: String 
	, item_sold_in_month: {
		type: Number
		, default: 0
	}
	, item_status:  {
		type: String
		, default: 'active'
	}
	, item_external_status: {
		type: Boolean,
		default: false
	}
	, item_sold_count_total: {
		type: Number
		, default: 0
	}
	, type: String
});

// Note: Consider sold_at

module.exports = mongoose.model("material_items", materialItemSchema, "material_items");
