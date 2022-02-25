'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const discountSchema = new Schema({
    discount_reason: String
    , discount_type: String
    , discount_number: Number
    , discount_code: String //optional. maybe useful in future?
})

const addonSchema = new Schema({
    heading: String,
    type: String
    , name: String
    , price: Number
});

const printerSchema = new Schema({
	name : String
	, type: String // ['kitchen', 'bill']
	, printer_name: String
	, floor_name: String
    , floor_id: String
    , selected: Boolean
});


const itemSchema = new Schema({
    category_id: String
    , item_id: String
    , skucode: String
    // , category_name: String
    , from_table_id: String
    , name: String
    , selling_price: Number
    , sold_price: Number
    , price_before_discount: Number
    , price_after_order_discount: Number
    , food_type: String
    , kot_order: String
    , combo_menu: String
    , quantity: Number
    , delquantity: Number
    , count: Number
    , kot_number : String   //Not using as for now
    , requests: String 
    , applied_addons: [addonSchema]
    , discount_applied: {
        type: Boolean
        , default: 0
    }
    , discount_detail: {
        type: discountSchema
        , default: {}
    }
    , item_status: {
        type : String
    }
    , item_external_status: {
		type: Boolean,
		default: false
	}
    , is_applied_tax: {
		type: Boolean,
	}
	, tax_rates: {
		type: Array
	}
    , customer_id: String
    , customer_name: String
    , assigned_printer: String
    , assigned_printers: [printerSchema]
	, printer_id: String
})

// const itemSchema = new Schema({
//     category_id: String
//     , name: String
//     , selling_price: Number
//     , sold_price: Number
//     , price_before_discount: Number
//     , caregory_name: String
//     , requests: String
//     , is_applied_tax: {
// 		type: Boolean,
// 		default: false
// 	}
// 	, tax_rates: {
// 		type: Array
// 	}
//     , quantity: Number
//     , count: Number
//     , applied_addons: [addonSchema]
//     , discount_applied: Boolean
//     , discount_detail: [discountSchema]
// })

const BillItemSchema = new Schema({
    /**
     *  NOTE: Item_list am passing here is just an array
     *  am just pushing it not creating it with structure
     */
    item_list: [itemSchema]
    , bill_status: { type: String, default: 'billed' }
    , paid_by: String
    , orderer_id: String
    , orderer_name: String
    , bill_cost: Number
    , bill_taxes_details: { type: Array }
    , bill_tax_amount: { type: Number , default: 0 }
    , service_charge_percentage: Number
    , service_charge_amount: Number
    , bill_cost_incl_tax: Number
    , bill_final_cost: Number
    , paid_at: { type: Date, default: Date.now }
    , my_order: Boolean
});

const billerDetailsSchmea = new Schema({
    biller_id: String
    , biller_name: String
    , initiated_by_customer: Boolean
    , biller_position: String
})

const billSchema = new Schema({
    company_id: String
    , branch_id: String
    , bill_type: String
    , bill_count: Number
    , bills: [{ type: BillItemSchema }]
    , billed_at: {
        type: Date,
        default: Date.now
    }
    // , order_cost: Number
    , order_id: String
    , external_order_id: { type:Number,default:0}
    , rider_status: { type: ["Mixed"],default: null}
    , order_number: String
    , table_id: String
    , delivery_id: String
    , takeaway_id: String
    , order_discount: Object
    , order_offer: Object
    , biller_details: {
        type: billerDetailsSchmea
    }
});

module.exports = mongoose.model('bills', billSchema);