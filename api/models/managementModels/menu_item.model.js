"use strict";
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const optionSchema = new Schema({
	name: String
	, hide_option: {
		type: Boolean
		, default: false
	}
	, price: {
		type: Number
		, default: 0
	}
})

const addonSchema = new Schema({
	heading: String
	, type: String
	, options: [optionSchema]
	, status: {
		type: String,
		// enum: ["active", "removed"],
		default: "active"
	}
	, limit: Number
	// , max_select: Number
	// , cumpulsary: String
	// sub_menu: [optionSchema]
});

const sessionSchema = new Schema({
	from_time: String
	, to_time: String
})

const availabilitySchema = new Schema({
	day: {
		type: String
		, lowercase: true
		, trim : true
	}
	, status: {
		type: Boolean,
		enum: [true, false],
		default: true
	}
	, sessions: [sessionSchema]
});

const printerSchema = new Schema({
	name : String
	, type: String // ['kitchen', 'bill']
	, printer_name: String
	, floor_name: String
	, floor_id: String
	, selected: {
		type: Boolean
		, default: false
	}
});

const menuItemSchema = new Schema({
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
	, selling_price: {
		type: Number
		, default: 0
	}
	, food_type: String
	, kot_order: String
	, combo_menu: {
		type: Boolean,
		default: false
	}
	, addons: [addonSchema]
	, item_description: String
	, item_status: {
		type: String,
		default: "active"
	}
	, item_external_status: {
		type: Boolean,
		default: false
	}
	, item_rank: Number
	, available_days: [ availabilitySchema ]
	, last_updated_month: String 
	, item_sold_in_month: {
		type: Number
		, default: 0
	}
	, item_sold_count_total: {
		type: Number
		, default: 0
	}
	, is_applied_tax: {
		type: Boolean,
		default: false
	}
	, tax_rates: {
		type: Array
	}
	, sold_at: {
		type: Date,
		default: Date.now
	}
	, assigned_printer: String
	, assigned_printers: [printerSchema]
	, printer_id: String
});

menuItemSchema.index({ 'name': 'text' });

// Note: Consider sold_at

module.exports = mongoose.model("menu_items", menuItemSchema);
