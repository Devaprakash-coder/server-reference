'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

//NOTE: Can be used in future
const serviceAddOnSchema = new Schema({
    name: String,
    type: String,
    price: String,
    options: String
})

const serviceSchema = new Schema({
    name: String,
    has_addon: {
        type: Boolean,
        default: 0
    },
    add_on: [serviceAddOnSchema],
    status: {
        type: String,
        default: "active"
    }
})

const memberPositionSchema = new Schema({
    position: String,
    created_on: {
        type: Date,
        default: Date.now
    },
    status: {
        type: String,
        default: "active"
    },
    member_count: {
        type: Number,
        default: 0
    },
    members: [{
        type: Schema.Types.ObjectId, 
        ref: 'members_directory'
    }],
    access: {
        type: Array,
        default: [
            { "oms": false },
            { "database": false },
            { "analytics": false },
            { "setup": false },
            { "inventory": false },
            { "menu": false }
        ]
        // default: [
        //     { 
        //         module: 'oms', access_details: [ 
        //             { name: 'floor', selected: true, access: [{ name: 'branch_1' , selected: true }, { name: 'branch_2', selected: true }, { name: 'branch_3', selected: true }, { name:'branch_4', selected: false }, { name: 'all', selected: false } ] },
        //             { name: 'table functions', selected: true, access: [{ name: 'table_start', selected: true }, { name: 'table_merge', selected: true }, { name: 'table_close', selected: false }, { name: 'all', selected: false } ] },
        //             { name: 'payment functions', selected: true, access: [{ name: 'payment_handling', selected: true }, { name: 'discount_handling', selected: true }, { name: 'print_handling',  selected: false }, { name: 'all', selected: false } ] },
        //         ]
        //     },
        //     { 
        //         module: 'my account', access_details: [ 
        //             { name: 'setup', selected: true, access: [{ name: 'all', selected: true }] },
        //             { name: 'management', selected: true, access: [{ name: 'all', selected: true }] },
        //             { name: 'analytics', selected: true, access: [{ name: 'all', selected: true }] },
        //             { name: 'valet', selected: true, access: [{ name: 'all', selected: true }] }
        //         ]
        //     }
        // ]
    }
});

const customerTypeSchema = new Schema({
    customer_type: String,
    created_on: {
        type: Date,
        default: Date.now
    },
    min_visits: {
        type: Number,
        default: 0
    },
    status: {
        type: String,
        default: "active"
    }
});

const customerMetaSchema = new Schema({
    company_id: String
    , branch_id: String
    , customer_types: [customerTypeSchema]
    , member_positions: [memberPositionSchema]
    // , services: [serviceSchema]
});

// customerMetaSchema.virtual('members_temp', {
//     ref: 'members_directory', // The model to use
//     localField: '_id', // Find people where `localField`
//     foreignField: 'position_id', // is equal to `foreignField`
//     // If `justOne` is true, 'members' will be a single doc as opposed to
//     // an array. `justOne` is false by default.
//     // justOne: false,
//     // options: { sort: { name: -1 }, limit: 5 } // Query options, see http://bit.ly/mongoose-query-options
//   });

module.exports = mongoose.model('customer_meta', customerMetaSchema);