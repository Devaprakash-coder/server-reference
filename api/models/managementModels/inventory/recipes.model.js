'use strict';

const mongoose = require('mongoose'),
    Schema = mongoose.Schema;

// const inStockSchema =  new Schema({
//     purchase_order_id: String
//     , material_price: Number
//     , material_quantity: Number
// });

const ingredientSchema = new Schema({
    required_quantity: Number
    , material_name: String
    , material_id: String
    , short_unit: String
    // , stocks: [ inStockSchema ]
});

const recipeSchema =  new Schema({
    company_id: String
    , branch_id: String
    , item_id: String
    , item_name: String
    , selling_price: Number
    , category_id: String
    , ingredients: [ ingredientSchema ]
});

module.exports =  mongoose.model('recipes', recipeSchema, 'recipes');