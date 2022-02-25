"use strict";
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const menuSectionSchema = new Schema({
	header: String
	, name: String
	, section_order: Number
	, selected: {
		type: Boolean
		, default: false
	}
	// , section_image : String // optional for now
});

const menuDeptSchema = new Schema({
	header: String
	, name: String
	, section_order: Number
	, selected: {
		type: Boolean
		, default: false
	}
	, menu_sections: [menuSectionSchema]
	// , section_image : String // optional for now
});

const menuBrandSchema = new Schema({
	brand_id: String
	,name: String
	, urban_id: String
	, selected: {
		type: Boolean
		, default: false
	}
	// , section_image : String // optional for now
});

const categoriesSchema = new Schema({
	name: String
	, rank: Number
	, item_count: Number
	, associated_menu_sections: [menuSectionSchema]
	, associated_dept_sections: {
		type: [menuDeptSchema],
		default: []
	}
	, associated_brand_sections: [menuBrandSchema]
	, imageUrl: {
		type: String
		, default: ''
	}
	, status: {
		type: String,
		default: 'active' // ['active','inactive', 'removed']
	}
})

const menuCategorySchema = new Schema({
	company_id: String,
	branch_id: String,
	categories: [categoriesSchema],
});

module.exports = mongoose.model("menu_categories", menuCategorySchema);
