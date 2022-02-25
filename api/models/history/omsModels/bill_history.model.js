'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const discountSchema = new Schema({
    discount_reason: String
    , discount_type: String
    , discount_number: Number
    , discount_code: String //optional. maybe useful in future?
})

const itemSchema = new Schema({
    category_id: String
    , name: String
    , skucode: String
    , selling_price: Number
    , sold_price: Number
    , price_before_discount: Number
    , price_after_order_discount: Number
    , caregory_name: String
    , item_id: String
    , requests: String
    , item_external_status: {
		type: Boolean,
		default: false
	}
    , applied_addons: {
        type: Array
        , default: []
    }
    , is_applied_tax: {
		type: Boolean,
		default: false
	}
	, tax_rates: {
		type: Array
	}
    , combo_menu: String
    , quantity: Number
    , delquantity: Number
    , count: Number
    , discount_applied: Boolean
    , discount_detail: [discountSchema]
})

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
    , bill_cost_before_discount: Number
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

module.exports = mongoose.model('history_bills', billSchema);