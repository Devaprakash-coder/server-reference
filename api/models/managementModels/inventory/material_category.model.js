"use strict";
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const categoriesSchema = new Schema({
	name: String
	, rank: Number
	, item_count: Number
	, imageUrl: {
		type: String
		, default: ''
	}
	, status: {
		type: String,
		default: 'active'
	}
})

const materialCategorySchema = new Schema({
	company_id: String,
	branch_id: String,
	categories: [categoriesSchema],
});

module.exports = mongoose.model("material_categories", materialCategorySchema, "material_categories");
