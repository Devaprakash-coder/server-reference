'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;


const discountSchema = new Schema({
    discount_reason: String
    , discount_type: String
    , discount_number: Number
    , discount_code: String //optional. maybe useful in future?
})

const offerSchema = new Schema({
    offer_id: String
    , coupon_id: String
    , offer_type: String
    , offer_value: Number
    , offer_code: String
    , applied_coupon: String
    , offer_description: String
})

const addonSchema = new Schema({
    heading: String,
    type: String
    , name: String
    , price: Number
});

const peopleSchema = new Schema({
    name: String
    , user_id: String
    // , is_initiator: Boolean  //can be used to find who is the initiator
})

// const paymentDetailsSchema = new Schema({
//     // payment_mode: String
//     // , amount_paid: Number
//     // , payment_type: String //Optional
//     // , payer_name: String
//     buyers_name: String
//     , amount: Number
//     , purpose: String
//     , payment_id: String
//     , currency: String
//     , instrument_type: String
//     , billing_instrument: String
//     , paid_out_at: String
// })

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
    // , category_name: String
    , from_table_id: String
    , name: String
    , skucode: String
    , selling_price: Number
    , sold_price: Number
    , price_before_discount: Number
    , food_type: String
    , kot_order: String
    , combo_menu: String
    , quantity: Number
    , delquantity: Number
    , reprintTotal: { type:Number,default:0}            
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
        , default : 'ordered'       //NOTE : Not sure where is by default active or ordered
    }
    , item_external_status: {
		type: Boolean,
		default: false
	}
    , remove_reason: String
    , is_applied_tax: {
		type: Boolean,
		default: false
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

const subOrderSchema = new Schema({
    order_status: {
        type : String
        , default : 'placed'
    }
    , order_kds_status: {
        type : String
        , default : 'todo'       //NOTE : Not sure where is by default active or ordered
    }
    , kot_number: String
    , order_type: String  //in_house , takeaway, home_delivery 
    , order_cost: Number
    , item_details: [itemSchema]
    , kot_confirmed_by: {
        type: Schema.Types.ObjectId, 
        ref: 'members_directory'
    }
    , ordered_at: { type: Date, default: Date.now }
})

const itemDiscountModelSchema = {
    item_id: String,
    item_cost: Number,
    discount_type: String,
    discount_number: Number,
    discounted_amount: Number,
    new_item_cost: Number
}


const orderSchema = new Schema({
    company_id: String
    , branch_id: String
    , table_id: String
    , delivery_id: String
    , order_id: String
    , printTotal: { type:Number,default:0}        
    , order_number: String
    , order_type_number: String
    , has_alert: { type : Boolean, default: false}
    , order_list: [ subOrderSchema ]
    , ordered_time: {
        type: Date,
        default: Date.now
    }
    , delivered_time: String
    , order_status: {
        type : String
        , default : 'placed'
    }
    , order_type: String  //in_house , takeaway, home_delivery 
    , delivery_address: Object
    , delivery_person: String
    , external_order_id: { type:Number,default:0}
    , rider_status: { type: ["Mixed"],default: null}
    , order_discount: { type: discountSchema , default: {} }
    , item_discounts: { 
        total_discount: Number ,
        total_items: Number,
        discounted_items: [itemDiscountModelSchema],
        default: {}
    }
    , offer_applied: {
        type: Boolean
        , default: 0
    }
    , offer_value: {
        type: Number
        , default: 0
    }
    , offer_detail: {
        type: offerSchema
        , default: {}
    }
    , paid_by: { type: String , default: '' }
    , order_tax_details: { type: Array }
    , order_tax_amount: { type: Number, default: 0 }
    , is_applied_service_charge: Boolean
    , service_charge_percentage: Number // get the number from company
    , service_charge_amount: Number
    , total_cost: Number    // Number without discount
    , total_cost_after_dicount: Number // includes cost after dicount
    , total_after_incl_tax: Number // after inclusion of tax
    , final_cost: Number    // bill total after all discounts
    , grand_total: Number // used to replace previous final_cost function


    // temp
    // , bill_cost: Number
    // , bill_taxes_details: { type: Array }
    // , bill_tax_amount: { type: Number , default: 0 }
    // * , service_charge_percentage: Number
    // * , service_charge_amount: Number
    // , bill_cost_incl_tax: Number
    // , bill_final_cost: Number



    // , people_in_order: {
    //     type: [ peopleSchema ]
    //     , default: []
    // }
    , has_unassigned_items : {
        type: Boolean
        , default: false
    }
    , is_order_paid: {
        type: Boolean
        , default: false
    }
    , is_live: Boolean
    , bill_id : String
    , payment_details: Object
});

module.exports = mongoose.model('live_orders', orderSchema);