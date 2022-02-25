"use strict";
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

//NOTE : Upcoming Feature
const quickAddonOptionSchema =  new Schema({
	name: String
	, price: Number
});

const linkedBranchSchema =  new Schema({
	branch_id: String,
	branch_name: String
});

// const quickActionAddon = new Schema({
//   name: String
//   , type: String
//   , options: [quickAddonOptionSchema]
// });

const counterSchema = new Schema({
	kot_count: {
		type: String
		, default: '000000'
	}
    , order_count: {
		type: String
		, default: '000000'
	}
    , take_away_count: {
		type: String
		, default: '000000'
	}
    , table_order_count: {
		type: String
		, default: '000000'
	}
    , online_order_count: {
		type: String
		, default: '000000'
	}
    , home_delivery_count: {
		type: String
		, default: '000000'
	}
});

const taxSchema = new Schema({
	name: String
	, value: Number
})

const quickActionSchema = new Schema({
  name: String
  , has_addon: {
	  type: Boolean
	  , default: 0
  }
  , free_service: {
	  type: Boolean
	  , default: 1
  }
  , service_cost: [quickAddonOptionSchema]
//   , add_on: [quickActionAddon]
  , status: {
	  type: String
	  , default: "active"       //[active, inactive]
  }
  , editable: Boolean
})

const tablePlanSchema = new Schema({
	name: String
	, table_count: Number
	, table_prefix: String
	, starting_table_count: {
		type: String
		, default: 1
	}
	, status: {
		type: String
		, default: "active"
	}
});

const menuSectionSchema = new Schema({
	header: String
	, name: String
	, section_order: Number
	, imageUrl : String // optional for now
	, selected: {
		type: Boolean
		, default: false
	}
});

let popupBannerSchema = new Schema({
	title: String
	, linked_category: {
		type: Schema.Types.ObjectId
		, ref: 'menu_categories'
	}
	, cta_text: String
	, description: String
	, img_url: String
	, visibility: {
		type: String
		, default: 'hidden'
	}
})

const departmentSchema = new Schema({
	header: String
	, name: String
	, department_order: Number
	, imageUrl : String // optional for now
	, visibility: {
		type: String
		, default: 'visible' // ['visble', 'hidden']
	}
	, pop_up_banners: {
		type: [popupBannerSchema]
		, default:[]
	}
	, menu_sections: [menuSectionSchema]
});

const bannerSchema = new Schema({
	img_url: String
})

const sessionSchema = new Schema({
	from_time: String
	, to_time: String
})

const hoursSchema = new Schema({
	day: {
		type: String
		, lowercase: true
		, trim : true
	}
	, status: {
		type: Boolean
		, enum: [true, false]
	}
	, sessions: [sessionSchema]
});

const settingSchema = new Schema({
	kot_print : {
		type: Boolean
		, default: true
	},
	duplicate_print_count : {
		type: Number
		, default: 0
	},
	apply_gst: {
		type: Boolean
		, default: false
	},
	inclusive_tax: {
		type: Boolean
		, default: false
	}
});

const printerSchema = new Schema({
	name : String
	, type: String // ['kitchen', 'bill']
	, printer_name: String
	, floor_name: String
	, floor_id: String
	, selected: Boolean
});

const printerServerSchema = new Schema({
	name : String
	, assigned_ip: String
	, default_server: {
		type: Boolean
		, default: false
	}
});

const branchSchema = new Schema({
	name: String
	, company_id: String
	, location: String
	, opening_hours: [hoursSchema]
	, table_plans: [tablePlanSchema]
	, quick_options: [quickActionSchema]
	, linked_branches: [ linkedBranchSchema ]
	, setting : [ settingSchema ]
	, logo_url: String
	, gst_value: {
		type: Number //not using this anymore
		, default: 0
	}
	, tax_value: {
		type: Number
		, default: 0
	}
	, taxes: [ taxSchema ]
	, counters: counterSchema
	, assigned_printers: [printerSchema]
	, printer_servers: [printerServerSchema]
	, menu_sections: [menuSectionSchema]
	, departments: [departmentSchema]
	, banner_images: [bannerSchema]
	, has_department_module: {
		type: Boolean
		, default: false
	}
});

module.exports = mongoose.model("branches", branchSchema, "branches");
