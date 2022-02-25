'use strict';
const CompletedBills = require('../../models/history/omsModels/bill_history.model');
const PaymentHistory = require('../../models/history/omsModels/payment_history.model');
const CustomerModel =  require('../../models/managementModels/customer_directory.model');
const HistoryTables = require('../../models/history/omsModels/table_history.model');
const TablesModel = require('../../models/omsModels/table.model');
const OrderHistory = require('../../models/history/omsModels/order_history.model')
const Memberdirectory = require('../../models/managementModels/member_directory.model')
const NotCompletedBills = require('../../models/omsModels/bill.model');
const LiveOrders = require('../../models/omsModels/order.model');
const mongoose = require("mongoose");

exports.getitemlist = (req, res) =>{
    if (req.accessType === 'superadmin' || req.accessType === 'admin' || req.accessType === 'staffs') {
        // let branchId;
        // let fromDate = new Date(Number(req.params.fromDate));
        // let toDate = new Date(Number(req.params.toDate));
        // let timezone = req.params.timezonect+"/"+ req.params.timezonearea;
        // branchid = req.query.branchid;

        CompletedBills.aggregate(           
            [
                {
                  '$match': {
                    'branch_id': '610131aa8993a56771b1a506', 
                    'billed_at': {
                      '$gte': new Date('Thu, 29 Nov 2021 21:30:00 GMT'), 
                      '$lte': new Date('Tue, 30 Nov 2021 21:30:00 GMT')
                    }
                  }
                }, 
                {
                    '$unwind': '$bills'
                  },
                {
                    '$project': {
                        bills_list: {
                            $filter: {
                               input: "$bills.item_list",
                               as: "item",
                               cond: { $eq: [ "$$item.category_id", '6106028da68250078211411f' ] }
                            }
                         }
                    }
                },
              
              ]
        , (err, totalCostReport) => {
            if (err) {
                console.error({
                    status: 0,
                    message: 'error getting bills',
                    error: err
                })
                res.status(500).json({
                    status: 0,
                    message: 'error getting bills',
                    error: 'problem with the server'
                })
            } else {
                res.status(200).json({
                    status: 1,
                    data: totalCostReport
                  
                })
            }
        })
    } else {
        res.status(401).json({
            status: 0,
            message: 'error getting report',
            error: 'invalid access'
        });
    }

}

exports.getSalesReport = (req, res) => {
    if (req.accessType === 'superadmin' || req.accessType === 'admin' || req.accessType === 'staffs') {
        let branchId;
        let fromDate = new Date(Number(req.params.fromDate));
        let toDate = new Date(Number(req.params.toDate));
        let timezone = req.params.timezonect+"/"+ req.params.timezonearea;
        branchId = req.params.branchId;

        CompletedBills.aggregate([
            {
                    
                $addFields: {
                    searchdate: {
                        $toDate:{
                        $dateToString: {
                            date: '$billed_at',
                            timezone: timezone
                        }
                    }
                     }
                    }
            },
            {
                $match: {
                    branch_id: branchId,
                    searchdate: {
                        $gte: fromDate,
                        $lte: toDate
                    }
                }
            },
            { $unwind: { path: "$bills" } },
            {
                $project: {
                    item_list: "$bills.item_list",
                    paid_at:  {
                        $toDate:{
                        $dateToString: {
                            date: '$bills.paid_at',
                            timezone: timezone
                        }
                    }
                },searchdate:1
                }
            },
            { $unwind: { path: "$item_list" } },
            {
                $group: {
                    _id: { $dayOfYear: '$searchdate' },
                    total_sold_price: { $sum: { $multiply: ["$item_list.sold_price", "$item_list.quantity"] } },
                    date: { "$first": '$paid_at' },
                }
            }
        ], (err, totalCostReport) => {
            if (err) {
                console.error({
                    status: 0,
                    message: 'error getting bills',
                    error: err
                })
                res.status(500).json({
                    status: 0,
                    message: 'error getting bills',
                    error: 'problem with the server'
                })
            } else {
                res.status(200).json({
                    status: 1,
                    data: totalCostReport
                  
                })
            }
        })
    } else {
        res.status(401).json({
            status: 0,
            message: 'error getting report',
            error: 'invalid access'
        });
    }
}
exports.getBills = (req, res) =>{
    if (req.accessType === 'superadmin' || req.accessType === 'admin' || req.accessType === 'staffs') {
        let branchId;
        let fromDate = new Date(Number(req.params.fromDate));
        let toDate = new Date(Number(req.params.toDate));
        let timezone = req.params.timezonect+"/"+ req.params.timezonearea;
        branchId = req.params.branchId;
      CompletedBills.aggregate([
        {
                    
            $addFields: {
                searchdate: {
                    $toDate:{
                    $dateToString: {
                        date: '$billed_at',
                        timezone: timezone
                    }
                }
                 }
                }
        },
            {
                $match: {
                    branch_id: branchId,
                    searchdate: {
                        $gte: fromDate,
                        $lte: toDate
                    }
                }
            },
            
        ], (err, bills) => {
            if (err) {
                console.error({
                    status: 0,
                    message: 'error getting bills',
                    error: err
                })
                res.status(500).json({
                    status: 0,
                    message: 'error getting bills',
                    error: 'problem with the server'
                })
            } else {
                bills.forEach(element => {

                    let discountamt= 0;
                    let cost_before_discount = 0;
                    let discounted_item_cost = 0;
                    let discount_number = 0;
                    element.bills.forEach(bill => {
                    if(element.order_discount.discount_type != undefined){
                        if(element.order_discount.discount_type == "percentage"){
                            cost_before_discount = bill.bill_cost /(1-(element.order_discount.discount_number/100));
                           
                            // discountamt = discounted_item_cost - element.total_sold_price;
                        }
                        if(element.order_discount.discount_type == "amount"){
                            cost_before_discount = bill.bill_cost+element.order_discount.discount_number;
                            // discounted_item_cost = (element.total_sold_price/cost_before_discount)*element.bill_cost;
                            // discountamt = discounted_item_cost - element.total_sold_price;
                        }
                        if(element.order_discount.discount_type == "flat"){
                            bill.item_list.forEach(items => {
                           let  totalcost = items.quantity * items.sold_price;
                                cost_before_discount = cost_before_discount + totalcost;
    
                            });
                            
                            // discounted_item_cost = (element.total_sold_price/cost_before_discount)*element.bill_cost;
                            // discountamt = discounted_item_cost - element.total_sold_price;
                        }
                        if(element.order_discount.discount_type == "new_value"){
                            bill.item_list.forEach(items => {
                                let  totalcost = items.quantity * items.sold_price;
                                     cost_before_discount = cost_before_discount + totalcost;
         
                                 });
                          //  cost_before_discount = element.order_discount.discount_number;
                            // discounted_item_cost = (element.total_sold_price/cost_before_discount)*element.bill_cost;
                            // discountamt = discounted_item_cost - element.total_sold_price;
                        }

                        bill.item_list.forEach(items => {

                            let price_after_order_discount = 0; 
                            let total_sold_price = items.quantity * items.sold_price;
                            price_after_order_discount = (items.sold_price/cost_before_discount)*bill.bill_cost;
                            console.log(price_after_order_discount);
                            let query = { _id: element._id };
                            let update = {
                                $set: {
                     
                                        "bills.$[].item_list.$[item].price_after_order_discount": price_after_order_discount,

                                }
                            };
                            let options = {
                                arrayFilters: [{ "item._id": mongoose.Types.ObjectId(items._id) }],
                                new: true
                            };
                            
                            CompletedBills.findOneAndUpdate(query, update, options, (err, updateitem) => {
                                    if (err) {
                                       console.log(err);
                                    } else {
                                    console.log(updateitem);
                                    }
                                });
                        });
                        let query = { _id: element._id };
                        let update = {
                            $set: {
                 
                                    "bills.$[].bill_cost_before_discount": cost_before_discount,

                            }
                        };
                        let options = {
                            // arrayFilters: [{ "item._id": mongoose.Types.ObjectId(items._id) }],
                            new: true
                        };
                        
                        CompletedBills.findOneAndUpdate(query, update, options, (err, updatebill) => {
                                if (err) {
                                   console.log(err);
                                } else if (updatebill) {
                                    
                                        console.log(updatebill);
                                    
                                } else {
                                    console.log(err);
                                }
                            });
                  
                    }

                });
                });
                res.status(200).json({
                    status: 1,
                    data: bills
                })
            }
        })
    } else{
        res.status(401).json({
            status: 0,
            message: 'error getting report',
            error: 'invalid access'
        });
    }
}
exports.getItemSalesReport = async (req, res) => {
        if (req.accessType === 'superadmin' || req.accessType === 'admin' || req.accessType === 'staffs') {
            let branchId;
            let fromDate = new Date(Number(req.params.fromDate));
            let toDate = new Date(Number(req.params.toDate));
            let timezone = req.params.timezonect+"/"+ req.params.timezonearea;
            branchId = req.params.branchId;
            console.log('branchId================',branchId);
            let orderHistory = await OrderHistory.aggregate([
                
                {
                    
                    $addFields: {
                        orderdate: {
                            $toDate:{
                            $dateToString: {
                                date: '$ordered_time',
                                timezone: timezone
                            }
                        }
                         }
                        }
                },
                {

                    $match: {
                        branch_id: branchId,
                        orderdate: {
                            $gte: fromDate,
                            $lte: toDate
                        },
                        order_status :"completed"
                        
                    }
                },
                { $unwind: { path: "$order_list" } },
                {
                    $project: {
                        item_list: "$order_list.item_details"
                    }
                },
                {
                    $project: {
                       removed_items: {
                          $filter: {
                             input: "$item_list",
                             as: "list",
                             cond: { $eq: [ "$$list.item_status", 'removed' ] }
                          }
                       }
                    }
                },
                { $unwind: { path: "$removed_items" } },
                { 
                    "$addFields": {
                        "removed_items.applied_addons": {
                            "$cond": {
                                "if": 
                                {
                                    "$ne": [ { "$type": "$removed_items.applied_addons" }, "array" ]
                                },
                                "then": [],
                                "else": "$removed_items.applied_addons"
                            }
                        }
                    }
                },
                { 
                    "$addFields": {
                        "removed_items.applied_addons.applied_addon_quantity": {
                            "$cond": {
                                "if": 
                                {
                                    "$eq": [ { "$type": "$removed_items.applied_addons" }, "array" ]
                                },
                                "then": "$removed_items.quantity",
                                "else": "[]"
                            }
                        }
                    }
                }, 
                {
                    $group:
                    {
                        _id: "$removed_items.name",
                        item_id: {$first: "$removed_items.item_id" },
                        item_applied_addons:{  $push: "$removed_items.applied_addons" },
                        item_tax_rate:{  $first: "$removed_items.tax_rates" },
                        selling_price: { $first: "$removed_items.selling_price" },
                        sold_price: { $first: "$removed_items.sold_price" },
                        category_id: { $first: '$removed_items.category_id' },
                        total_item_removed_quantity: { $sum: "$removed_items.quantity" }
                    }
                },
            ])
            console.log('orderHistory=================',orderHistory);
            let billHistory = await CompletedBills.aggregate([
                {
                    $addFields: {
                        billeddate: {
                            $toDate:{
                            $dateToString: {
                                date: '$billed_at',
                                timezone: timezone
                            }
                        }
                         }
                        }
                }, 
                {
                    $match: {
                        branch_id: branchId,
                        billeddate: {
                            $gte: fromDate,
                            $lte: toDate
                        },
                        "bills.bill_status":"paid"
                    }
                },
                { $unwind: { path: "$bills" } },
                {
                    $project: {
                        item_list: "$bills.item_list",
                        order_discount:1,
                        bill_cost:"$bills.bill_cost",
                        service_charge_amount:"$bills.service_charge_amount",
                        bill_count:{"$cond": {
                            "if": {
                                "$eq": [ "$bill_type", "split_equal" ]
                            },
                            "then":  "$bill_count",
                            "else":  1 
                        }   }

                    }
                },
                {    
                   $addFields: { 
    
                    'total_cost': {
                        $sum: [
                            {   
                        $map: {
                            input: "$item_list",
                            as: "item",
                            in: {          
                                "$cond": {
                                    "if": {
                                        "$eq": [ "$$item.discount_applied", true ]
                                    },
                                    "then": { $multiply: ["$$item.price_before_discount", {$divide :["$$item.quantity","$bill_count"]}] },
                                    "else": { $multiply: ["$$item.sold_price", {$divide :["$$item.quantity","$bill_count"]} ] }
                                }                      
                                        }
                                        
                                    

                            }
                        }
                    ]
                    },
                    'total_item_discounts' : {
                        $sum: [
                            {   
                        $map: {
                            input: "$item_list",
                            as: "item",
                            in: {          
                                "$cond": {
                                    "if": {
                                        "$eq": [ "$$item.discount_applied", true ]
                                    },
                                    "then": { $subtract :[{ $multiply: ["$$item.price_before_discount", {$divide :["$$item.quantity","$bill_count"]} ]},{ $multiply: ["$$item.sold_price", {$divide :["$$item.quantity","$bill_count"]} ]}] },
                                    "else": 0
                                }                      
                                        }
                                        
                                    

                            }
                        }
                    ]
                    },
                }
                },
                { $unwind: { path: "$item_list" } },
                {
                    $project:
                    {
                        "item_list":1,
                        bill_count:1,
                        discount_applied :"$item_list.discount_applied", 
                        discount_detail: "$item_list.discount_detail",
                        name:"$item_list.name",
                        "tax_rates": {
                            $filter: {
                                input: "$item_list.tax_rates",
                                as: "tax_rate",
                                cond: { "$eq": ["$$tax_rate.checked", true] }
                            }
                        },
                        selling_price:"$item_list.selling_price",
                        price_before_discount:"$item_list.price_before_discount",
                        order_discount:1,
                        sold_price: "$item_list.sold_price",
                        quantity: {$divide :["$item_list.quantity","$bill_count"]},
                        delquantity: {$divide :["$item_list.delquantity","$bill_count"]},
                        "bill_cost_incl_tax":1,
                        order_type:1,
                        bill_cost:1,
                        total_cost:1,
                        total_item_discounts:1,
                    }
                },
                { 
                    "$addFields": {
                        "item_list.applied_addons": {
                            "$cond": {
                                "if": 
                                {
                                    "$ne": [ { "$type": "$item_list.applied_addons" }, "array" ]
                                },
                                "then": [],
                                "else": "$item_list.applied_addons"
                            }
                        },
                        "item_actual_price": {
                            "$cond": {
                                "if": {
                                    "$eq": [ "$item_list.discount_applied", true ]
                                },
                                "then": { $multiply: ["$item_list.price_before_discount", "$quantity" ] },
                                "else": { $multiply: ["$item_list.sold_price", "$quantity" ] }
                            }
                        },                        
                        "discount_order_price": {
                            "$switch": {
                                "branches": [
                                  { "case": { "$eq": [ "$order_discount.discount_type", "amount" ] }, "then": {
                                    $multiply:[{ $divide :["$item_list.sold_price",{$add : ["$bill_cost","$order_discount.discount_number"]}]},"$bill_cost"]}}
                                    ,
                                  { "case": { $and : [ { "$eq": [ "$order_discount.discount_type", "percentage"  ] },
                                  { "$ne": [ "$order_discount.discount_number", 100  ] }] } , "then": {
                                    $multiply:[{ $divide :["$item_list.sold_price",{$divide : ["$bill_cost",{ $subtract: [1,{$divide :["$order_discount.discount_number",100]}]}]}]},"$bill_cost"]}},
                                    { "case": { $and : [ { "$eq": [ "$order_discount.discount_type", "percentage"  ] },
                                    { "$eq": [ "$order_discount.discount_number", 100  ] }] } , "then": 0 },
                                  { "case": { "$eq": [ "$order_discount.discount_type", "flat" ] }, "then": 0 },
                                  { "case": { "$eq": [ "$order_discount.discount_type", "new_value"  ] }, "then":
                                  {
                                    $multiply:[{ $divide :["$item_list.sold_price",{$subtract:["$total_cost", "$total_item_discounts"]}]},"$bill_cost"]}}                                     
                                ],
                                "default": "$item_list.sold_price"
                              }
                    
                    },

                    }
                },
                { 
                    "$addFields": {
                        "item_list.applied_addons.applied_addon_quantity": {
                            "$cond": {
                                "if": 
                                {
                                    "$eq": [ { "$type": "$item_list.applied_addons" }, "array" ]
                                },
                                "then": "$quantity",
                                "else": "[]"
                            }
                        }
                    }
                },
                {
                    $addFields: { 
                        'new_tax_rates': {
                            $sum: [
                                {   
                            $map: {
                                input: "$tax_rates",
                                as: "output",
                                in: {                                
                                    $multiply: [ 
                                                    {
                                                        $multiply: [
                                                            "$discount_order_price", 
                                                            { 
                                                                $divide: [ 
                                                                    "$$output.percentage", 100 
                                                                ] 
                                                            } 
                                                        ]
                                                    },
                                                    "$quantity"
                                                ]
                                            }
                                            
                                        
    
                                }
                            }
                        ]
                        },
                      
                        "item_discounted_price": { $multiply: [ "$discount_order_price", "$quantity"] },
                        "applied_item_discount_total": {
                            "$cond": {
                                "if": {
                                    "$eq": [ "$discount_applied", true ]
                                },
                                "then": { 
                                    $multiply: [
                                        {
                                            $subtract: [
                                                "$price_before_discount", 
                                                "$sold_price" 
                                            ] 
                                        },
                                        "$quantity"
                                    ]
                                },
                                "else": 0
                            }
                        }
                    }
                },
                {
                    $group: {
                        _id: "$item_list.name",
                        "tax_amount": { $sum: "$new_tax_rates" },
                        "item_total_price": { $sum: "$item_actual_price" },
                        "item_discounted_price": { $sum: "$item_discounted_price" },
                        "item_discount_total": { $sum: "$applied_item_discount_total" },
                        "order_discounted_cost":{$sum :"$total_order_discount_cost"},
                        item_applied_addons:{  $push: "$item_list.applied_addons" },
                        total_item_sold_quantity: { $sum: "$quantity" },
                        total_item_removed_quantity: { $sum: "$delquantity" },
                        selling_price: { $first: "$item_list.selling_price" },
                        total_selling_price: { $sum: { $multiply: ["$quantity", "$item_list.selling_price"] } },
                        category_id: { $first: '$item_list.category_id' },
                        total_sold_price: { $sum: "$item_actual_price" },
                        total_discount: { $sum:{$subtract : ["$item_actual_price","$item_discounted_price"]} },
                        subtotal : {$sum: "$item_discounted_price" },
                        grand_total : {$sum: {$add : ["$item_discounted_price","$new_tax_rates"]}},
                        
                    }
                },
                // {
                //     $group:
                //     {
                //         _id: "$item_list.name",
                //         item_id:{  $first: "$item_list.item_id" },
                //         item_tax_rate:{  $push: "$item_list.tax_rates" },
                //         item_applied_addons:{  $push: "$item_list.applied_addons" },
                //         item_applied_discounts:{  $addToSet: "$item_list.discount_detail" },
                //         total_item_sold_quantity: { $sum: "$item_list.quantity" },
                //         selling_price: { $first: "$item_list.selling_price" },
                //         total_selling_price: { $sum: "$item_list.selling_price" },
                //         total_selling_price: { $sum: { $multiply: ["$item_list.quantity", "$item_list.selling_price"] } },
                //         item_discount: { $sum: { $subtract: [  "$item_list.price_before_discount", "$item_list.sold_price"] } },
                //         item_order_discount: { $sum: { $subtract: [  "$item_list.sold_price", "$item_list.price_after_order_discount"] } },
                //         sold_price: { $first: "$item_list.sold_price" },
                //         sold_cost_price: { $addToSet: "$item_list.sold_price" },
                //         total_sold_price: { $sum: { $multiply: ["$item_list.quantity", "$item_list.sold_price"] } },
                //         category_id: { $first: '$item_list.category_id' },
                //     }
                // },
            
                // // {
                // //     $addFields:{
                // //         // item_discount: { $subtract: [  "$total_selling_price", "$total_sold_price"] },
                       
                // //     },
                // // },
                // {
                    // $addFields:{
                        //  total_item_removed_quantity: 0
                    //  }
                //  }
            ])
            
            let removedItem = [];

            await asyncForEach(orderHistory, async (item) => {
                let itemExistsOnBill = await billHistory.find((x) => ((x.item_id == item.item_id) || (x._id == item._id)) )
                if(itemExistsOnBill) {
                    await asyncForEach(billHistory, (bill) => {
                        if((bill.item_id == item.item_id) || (bill._id == item._id)) {
                            bill.total_item_removed_quantity = item.total_item_removed_quantity;
                            if(item.item_applied_addons) {
                                let updated_data = item.item_applied_addons.map((addons) =>  {
                                    // item.applied_addons_status = 'removed';
                                    // return item;
                                    addons.forEach(addon => {
                                        addon.status = 'removed'
                                    });
                                    return addons
                                }).filter((x)=> x.length )

                                if(updated_data.length) {
                                    bill.item_applied_addons = [...bill.item_applied_addons, ...updated_data]
                                }
                            }
                            
                        }
                    })
                }else{
                    removedItem.push({
                        _id: item._id,
                        item_id: item.item_id,
                        item_tax_rate: item.item_tax_rate,
                        total_item_sold_quantity: 0,
                        selling_price: item.selling_price,
                        total_selling_price: 0,
                        sold_price: item.sold_price,
                        total_sold_price: 0,
                        category_id: item.category_id,
                        item_discount: 0,
                        total_tax: 0,
                        grand_total: 0,
                        total_item_removed_quantity: item.total_item_removed_quantity
                    })
                }
            })

            const overAllItems = [...billHistory, ...removedItem]
            
            res.status(200).json({
                status: 1,
                data: overAllItems
            })
        } else{
            res.status(401).json({
                status: 0,
                message: 'error getting report',
                error: 'invalid access'
            });
        }
}

exports.getCategorySalesReport = (req, res) => {
    if (req.accessType === 'superadmin' || req.accessType === 'admin' || req.accessType === 'staffs') {
        let branchId;
        let fromDate = new Date(Number(req.params.fromDate));
        let toDate = new Date(Number(req.params.toDate));
        let timezone = req.params.timezonect+"/"+ req.params.timezonearea;
        branchId = req.params.branchId;
        CompletedBills.aggregate([
            {
                    
                $addFields: {
                    searchdate: {
                        $toDate:{
                        $dateToString: {
                            date: '$billed_at',
                            timezone: timezone
                        }
                    }
                     }
                    }
            },
            {
                $match: {
                    branch_id: branchId,
                    searchdate: {
                        $gte: fromDate,
                        $lte: toDate
                    },
                    "bills.bill_status":"paid"
                }
            },
            { $unwind: { path: "$bills" } },
            {
                $project: {
                    item_list: "$bills.item_list",
                    billed_at: "$billed_at",
                    order_discount:1,
                    bill_cost:"$bills.bill_cost",
                    branch_id: '$branch_id',
                    bill_count: {"$cond": {
                            "if": {
                                "$eq": [ "$bill_type", "split_equal" ]
                            },
                            "then":  "$bill_count",
                            "else":  1 
                        }   }

                    }
            },
            {    
                $addFields: { 
                 'total_cost': {
                     $sum: [
                         {   
                     $map: {
                         input: "$item_list",
                         as: "item",
                         in: {          
                             "$cond": {
                                 "if": {
                                     "$eq": [ "$$item.discount_applied", true ]
                                 },
                                 "then": { $multiply: ["$$item.price_before_discount", {$divide :["$$item.quantity","$bill_count"]} ] },
                                 "else": { $multiply: ["$$item.sold_price", {$divide :["$$item.quantity","$bill_count"]} ] }
                             }                      
                                     }
                                     
                                 

                         }
                     }
                 ]
                 },
                 'total_item_discounts' : {
                     $sum: [
                         {   
                     $map: {
                         input: "$item_list",
                         as: "item",
                         in: {          
                             "$cond": {
                                 "if": {
                                     "$eq": [ "$$item.discount_applied", true ]
                                 },
                                 "then": { $subtract :[{ $multiply: ["$$item.price_before_discount", {$divide :["$$item.quantity","$bill_count"]} ]},{ $multiply: ["$$item.sold_price", {$divide :["$$item.quantity","$bill_count"]} ]}] },
                                 "else": 0
                             }                      
                                     }
                                     
                                 

                         }
                     }
                 ]
                 },
             }
             },
            { $unwind: { path: "$item_list" } },
            {
                $project:
                {
                    "item_list":1,
                    discount_applied :"$item_list.discount_applied", 
                    discount_detail: "$item_list.discount_detail",
                    selling_price:"$item_list.selling_price",
                    price_before_discount:"$item_list.price_before_discount",
                   
                    'tax_rates': {
                        $filter: {
                            input: "$item_list.tax_rates",
                            as: "tax_rate",
                            cond: { "$eq": ["$$tax_rate.checked", true] }
                        }
                    },
                    selling_price:"$item_list.selling_price",
                    price_before_discount:"$item_list.price_before_discount",
                    order_discount:1,
                    sold_price: "$item_list.sold_price",
                    quantity: {$divide :["$item_list.quantity","$bill_count"]},
                    order_type:1,
                    // "item_list.discount_applied": 1, 
                    // "item_list.category_id": 1,
                    // "item_list.discount_detail": 1,
                    // "item_list.name": 1,
                    // "item_list.tax_rates": 1,
                    // "item_list.selling_price": 1,
                    // "item_list.price_before_discount": 1,
                    // "item_list.sold_price": 1,
                    // "item_list.quantity": 1,
                    "bill_cost": 1,
                    "bill_cost_incl_tax": 1,
                    "bill_final_cost": 1,
                    "billed_at": 1,
                    "branch_id": 1,
                    total_cost:1,
                    total_item_discounts:1,
                }
            },
            { 
                "$addFields": {
                    "item_actual_price": {
                        "$cond": {
                            "if": {
                                "$eq": [ "$item_list.discount_applied", true ]
                            },
                            "then": { $multiply: ["$item_list.price_before_discount", "$quantity" ] },
                            "else": { $multiply: ["$item_list.sold_price", "$quantity" ] }
                        }
                    },                        
                    "discount_order_price": {
                        "$switch": {
                            "branches": [
                              { "case": { "$eq": [ "$order_discount.discount_type", "amount" ] }, "then": {
                                $multiply:[{ $divide :["$item_list.sold_price",{$add : ["$bill_cost","$order_discount.discount_number"]}]},"$bill_cost"]}}
                                ,
                                { "case": { $and : [ { "$eq": [ "$order_discount.discount_type", "percentage"  ] },
                                { "$ne": [ "$order_discount.discount_number", 100  ] }] } , "then": {
                                  $multiply:[{ $divide :["$item_list.sold_price",{$divide : ["$bill_cost",{ $subtract: [1,{$divide :["$order_discount.discount_number",100]}]}]}]},"$bill_cost"]}},
                                  { "case": { $and : [ { "$eq": [ "$order_discount.discount_type", "percentage"  ] },
                                  { "$eq": [ "$order_discount.discount_number", 100  ] }] } , "then": 0 },
                              { "case": { "$eq": [ "$order_discount.discount_type", "flat" ] }, "then": 0 },
                              { "case": { "$eq": [ "$order_discount.discount_type", "new_value"  ] }, "then":
                              {
                                $multiply:[{ $divide :["$item_list.sold_price",{$subtract:["$total_cost", "$total_item_discounts"]}]},"$bill_cost"]}}                                     
                            ],
                            "default": "$item_list.sold_price"
                          }
                
                },

                }
            },
            {
                $addFields: { 
                    'new_tax_rates': {
                        $sum: [
                            {   
                        $map: {
                            input: "$tax_rates",
                            as: "output",
                            in: {                                
                                $multiply: [ 
                                                {
                                                    $multiply: [
                                                        "$discount_order_price", 
                                                        { 
                                                            $divide: [ 
                                                                "$$output.percentage", 100 
                                                            ] 
                                                        } 
                                                    ]
                                                },
                                                "$quantity"
                                            ]
                                        }
                                        
                                    

                            }
                        }
                    ]
                    },
                  
                    "item_discounted_price": { $multiply: [ "$discount_order_price", "$quantity"] },
                    "applied_item_discount_total": {
                        "$cond": {
                            "if": {
                                "$eq": [ "$discount_applied", true ]
                            },
                            "then": { 
                                $multiply: [
                                    {
                                        $subtract: [
                                            "$price_before_discount", 
                                            "$sold_price" 
                                        ] 
                                    },
                                    "$quantity"
                                ]
                            },
                            "else": 0
                        }
                    }
                }
            },
            {
                $group: {
                    _id: { 
                        "category_id" : "$item_list.category_id",
                        days_of_year: { $dayOfYear: "$billed_at" }
                    },
                    "tax_amount": { $sum: "$new_tax_rates" },
                    "item_actual_price": { $sum: "$item_actual_price" },
                    "item_discounted_price": { $sum: "$item_discounted_price" },
                    "applied_item_discount_total": { $sum: "$applied_item_discount_total" },
                    "applied_item_cost": { $sum: "$total_item_cost" },
                    "applied_order_discount_total": { $sum: "$order_discount_share_cost" },
                    category_id: { $first: "$item_list.category_id" },
                    billed_at: { $first: '$billed_at' },
                    branch_id: { "$first": '$branch_id' },
                    total_category_sold_quantity: { $sum: "$quantity" },
                    total_sold_price: { $sum: "$item_actual_price"},
                    total_discount: { $sum:{$subtract : ["$item_actual_price","$item_discounted_price"]} },
                    sub_total : {$sum: "$item_discounted_price" },
                    grand_total : {$sum: {$add : ["$item_discounted_price","$new_tax_rates"]}},
                    

                    // "tax_amount": 515.0999999999999,
                    // "item_actual_price": 9180,
                    // "item_discounted_price": 9180,
                    // "applied_item_discount_total": 0,
                    // "applied_item_cost": 0,
                    // "applied_order_discount_total": 0,
                    // "category_id": "609cce8369c41b3c26032346",
                    // "billed_at": "2021-06-02T05:42:56.084Z",
                    // "branch_id": "5eedfb67fe4fe2519bef43d1",
                    // "total_category_sold_quantity": 30,
                    // // "total_sold_price": 9180,
                    // "total_item_discount": 0
                }
            },
            {
                $lookup:
                {
                    from: "menu_categories",
                    localField: "branch_id",
                    foreignField: "branch_id",
                    as: "branch_details"
                }
            },
            {
                $project:
                {
                    'total_category_sold_quantity': 1, 
                    'branch_id': 1,
                    'branch_categories': "$branch_details.categories",
                    'item_actual_price': 1, 
                    "applied_date": 1, 
                    "total_item_discount": 1,
                    "category_id": 1,
                    "billed_at": 1,
                    tax_amount: 1,
                    item_discounted_price:1,
                    applied_item_discount_total: 1,
                    total_discount:1,
                    applied_item_cost:1,
                    sub_total:1,
                    grand_total:1,
                }
            },
            { $unwind: '$branch_categories' },
            {
                $project:
                {
                    'category_details': {
                        $filter: {
                            input: "$branch_categories",
                            as: "category",
                            cond: { "$eq": ["$$category._id", {$convert: {input: '$category_id', to : 'objectId', onError: '',onNull: ''}}] }
                        }
                    },
                    // 'total_category_sold_quantity': 1, 
                    // 'branch_id': 1,
                    // "applied_date": 1, 
                    // "total_item_discount": 1,
                    // 'item_actual_price': 1,
                    // "category_id": 1,

                    'total_category_sold_quantity': 1, 
                    'branch_id': 1,
                    'branch_categories': "$branch_details.categories",
                    'item_actual_price': 1, 
                    "applied_date": 1, 
                    "total_item_discount": 1,
                    "category_id": 1,
                    "billed_at": 1,
                    tax_amount: 1,
                    applied_item_discount_total: 1,
                    total_discount:1,
                    '_id': 0,
                    sub_total:1,
                    grand_total:1,
                }
            },
            { $unwind: '$category_details' },
            {
                $project: {
                    'category_name': '$category_details.name',
                    'total_category_sold_quantity': 1, 
                    'branch_id': 1,
                    'branch_categories': "$branch_details.categories",
                    'item_actual_price': 1, 
                    "applied_date": 1, 
                    "category_id": 1,
                    "billed_at": 1,
                    tax_amount: 1,
                    item_discounted_price:1,
                    applied_item_discount_total: 1,
                    total_discount:1,
                    '_id': 0,
                    sub_total:1,
                    grand_total:1,

                }
            },
            // {
            //     $addFields: {
            //         'sub_total': { $subtract: ["$item_actual_price", "$applied_item_discount_total"] },
            //         'grand_total': { $sum: [ { $subtract: ["$item_actual_price", "$applied_item_discount_total"] }, "$tax_amount"] }
            //     }
            // },
            { $sort: { "billed_at": -1 } }
        ], (err, bills) => {
            if (err) {
                console.error({
                    status: 0,
                    message: 'error getting categories bills',
                    error: err
                })
                res.status(500).json({
                    status: 0,
                    message: 'error getting categories bills',
                    error: 'problem with the server'
                })
            } else {
                res.status(200).json({
                    status: 1,
                    data: bills
                })
            }
        })
    } else {
        res.status(401).json({
            status: 0,
            message: 'error getting report',
            error: 'invalid access'
        });
    }
}
exports.getCategorySalesReport_backup = (req, res) => {
    if (req.accessType === 'superadmin' || req.accessType === 'admin' || req.accessType === 'staffs') {
        let branchId;
        let fromDate = new Date(Number(req.params.fromDate));
        let toDate = new Date(Number(req.params.toDate));
        let timezone = req.params.timezonect+"/"+ req.params.timezonearea;
        branchId = req.params.branchId;
        CompletedBills.aggregate([
            {
                    
                $addFields: {
                    searchdate: {
                        $toDate:{
                        $dateToString: {
                            date: '$billed_at',
                            timezone: timezone
                        }
                    }
                     }
                    }
            },
            {
                $match: {
                    branch_id: branchId,
                    searchdate: {
                        $gte: fromDate,
                        $lte: toDate
                    }
                }
            },
            { $unwind: { path: "$bills" } },
            {
                $project: {
                    item_list: "$bills.item_list",
                    billed_at: "$searchdate",
                    order_discount:1,
                    bill_cost:"$bills.bill_cost",
                    branch_id: '$branch_id'
                }
            },
            { $unwind: { path: "$item_list" } },
            {
                $project:
                {
                    'new_tax_rates': {
                        $filter: {
                            input: "$item_list.tax_rates",
                            as: "tax_rate",
                            cond: { "$eq": ["$$tax_rate.checked", true] }
                        }
                    },
                    "item_list.discount_applied": 1, 
                    "item_list.category_id": 1,
                    "item_list.discount_detail": 1,
                    "item_list.name": 1,
                    "item_list.tax_rates": 1,
                    "item_list.selling_price": 1,
                    "item_list.price_before_discount": 1,
                    "item_list.sold_price": 1,
                    "item_list.quantity": 1,
                    "bill_cost": 1,
                    "bill_cost_incl_tax": 1,
                    "bill_final_cost": 1,
                    "billed_at": 1,
                    "branch_id": 1
                }
            },
            { 
                $project: {
                    "item_list.tax_rates" : 0       
                }
            },
            { $unwind: { path: "$new_tax_rates" } },
            { 
                $addFields: { 
                    "item_actual_price": {
                        "$cond": {
                            "if": {
                                "$eq": [ "$item_list.discount_applied", true ]
                            },
                            "then": { $multiply: ["$item_list.price_before_discount", "$item_list.quantity" ] },
                            "else": { $multiply: ["$item_list.sold_price", "$item_list.quantity" ] }
                        }
                    },
                    "item_discounted_price": { $multiply: [ "$item_list.sold_price", "$item_list.quantity"] },
                    "applied_item_discount_total": {
                        "$cond": {
                            "if": {
                                "$eq": [ "$item_list.discount_applied", true ]
                            },
                            "then": { 
                                $multiply: [
                                    {
                                        $subtract: [
                                            "$item_list.price_before_discount", 
                                            "$item_list.sold_price" 
                                        ] 
                                    },
                                    "$item_list.quantity"
                                ]
                            },
                            "else": 0
                        }
                    },
                    "tax_amount": {
                        $multiply: [ 
                            {
                                $multiply: [
                                    "$item_list.sold_price", 
                                    { 
                                        $divide: [ 
                                            "$new_tax_rates.percentage", 100 
                                        ] 
                                    } 
                                ]
                            },
                            "$item_list.quantity"
                        ]
                    },
                    "tax_type": "$new_tax_rates.tax_type",
                    "tax_percentage": "$new_tax_rates.percentage",
                    "item_bill_cost": "$bill_cost",
                },
            },
            {
                $group: {
                    _id: { 
                        "category_id" : "$item_list.category_id",
                        days_of_year: { $dayOfYear: "$billed_at" }
                    },
                    "tax_amount": { $sum: "$tax_amount" },
                    "item_actual_price": { $sum: "$item_actual_price" },
                    "item_discounted_price": { $sum: "$item_discounted_price" },
                    "applied_item_discount_total": { $sum: "$applied_item_discount_total" },
                    "applied_item_cost": { $sum: "$total_item_cost" },
                    "applied_order_discount_total": { $sum: "$order_discount_share_cost" },
                    category_id: { $first: "$item_list.category_id" },
                    billed_at: { $first: '$billed_at' },
                    branch_id: { "$first": '$branch_id' },
                    total_category_sold_quantity: { $sum: "$item_list.quantity" },
                    total_sold_price: { $sum: { $multiply: ["$item_list.quantity", "$item_list.sold_price"] } },
                    total_item_discount: { $sum: "$applied_item_discount_total" }
                    

                    // "tax_amount": 515.0999999999999,
                    // "item_actual_price": 9180,
                    // "item_discounted_price": 9180,
                    // "applied_item_discount_total": 0,
                    // "applied_item_cost": 0,
                    // "applied_order_discount_total": 0,
                    // "category_id": "609cce8369c41b3c26032346",
                    // "billed_at": "2021-06-02T05:42:56.084Z",
                    // "branch_id": "5eedfb67fe4fe2519bef43d1",
                    // "total_category_sold_quantity": 30,
                    // // "total_sold_price": 9180,
                    // "total_item_discount": 0
                }
            },
            {
                $lookup:
                {
                    from: "menu_categories",
                    localField: "branch_id",
                    foreignField: "branch_id",
                    as: "branch_details"
                }
            },
            {
                $project:
                {
                    'total_category_sold_quantity': 1, 
                    'branch_id': 1,
                    'branch_categories': "$branch_details.categories",
                    'item_actual_price': 1, 
                    "applied_date": 1, 
                    "total_item_discount": 1,
                    "category_id": 1,
                    "billed_at": 1,
                    tax_amount: 1,
                    item_discounted_price:1,
                    applied_item_discount_total: 1,
                    applied_item_cost:1,
                }
            },
            { $unwind: '$branch_categories' },
            {
                $project:
                {
                    'category_details': {
                        $filter: {
                            input: "$branch_categories",
                            as: "category",
                            cond: { "$eq": ["$$category._id", {$convert: {input: '$category_id', to : 'objectId', onError: '',onNull: ''}}] }
                        }
                    },
                    // 'total_category_sold_quantity': 1, 
                    // 'branch_id': 1,
                    // "applied_date": 1, 
                    // "total_item_discount": 1,
                    // 'item_actual_price': 1,
                    // "category_id": 1,

                    'total_category_sold_quantity': 1, 
                    'branch_id': 1,
                    'branch_categories': "$branch_details.categories",
                    'item_actual_price': 1, 
                    "applied_date": 1, 
                    "total_item_discount": 1,
                    "category_id": 1,
                    "billed_at": 1,
                    tax_amount: 1,
                    applied_item_discount_total: 1,
                    '_id': 0
                }
            },
            { $unwind: '$category_details' },
            {
                $project: {
                    'category_name': '$category_details.name',
                    'total_category_sold_quantity': 1, 
                    'branch_id': 1,
                    'branch_categories': "$branch_details.categories",
                    'item_actual_price': 1, 
                    "applied_date": 1, 
                    "category_id": 1,
                    "billed_at": 1,
                    tax_amount: 1,
                    item_discounted_price:1,
                    applied_item_discount_total: 1,
                    '_id': 0
                }
            },
            {
                $addFields: {
                    'sub_total': { $subtract: ["$item_actual_price", "$applied_item_discount_total"] },
                    'grand_total': { $sum: [ { $subtract: ["$item_actual_price", "$applied_item_discount_total"] }, "$tax_amount"] }
                }
            },
            { $sort: { "billed_at": -1 } }
        ], (err, bills) => {
            if (err) {
                console.error({
                    status: 0,
                    message: 'error getting categories bills',
                    error: err
                })
                res.status(500).json({
                    status: 0,
                    message: 'error getting categories bills',
                    error: 'problem with the server'
                })
            } else {
                res.status(200).json({
                    status: 1,
                    data: bills
                })
            }
        })
    } else {
        res.status(401).json({
            status: 0,
            message: 'error getting report',
            error: 'invalid access'
        });
    }
}


exports.getDiscountsReport = async (req, res) => {
    if (req.accessType === 'superadmin' || req.accessType === 'admin' || req.accessType === 'staffs') {
        let branchId;
        let fromDate = new Date(Number(req.params.fromDate));
        let toDate = new Date(Number(req.params.toDate));
        branchId = req.params.branchId;
        let timezone = req.params.timezonect+"/"+ req.params.timezonearea;
        
        let orderHistory = await OrderHistory.aggregate([
            {
                    
                $addFields: {
                    searchdate: {
                        $toDate:{
                        $dateToString: {
                            date: '$ordered_time',
                            timezone: timezone
                        }
                    }
                     }
                    }
            },
            {
                $match: {
                    branch_id: branchId,
                    searchdate: {
                        $gte: fromDate,
                        $lte: toDate
                    },
                    order_status: "completed"
                }
            },
            {
                $project: {
                    order_tax_details : 0, order_tax_amount: 0, has_alert: 0,
                    is_applied_service_charge: 0, service_charge_percentage: 0,
                    service_charge_amount: 0, "order_list.item_details.tax_rates" : 0,
                    "order_list.item_details.assigned_printers" : 0, "order_list.item_details.assigned_printers" : 0,
                }
            },
            { $unwind: { path: "$order_list" } },
            {
                $project: {
                    order_discount: 1,
                    ordered_time: 1,
                    searchdate:1,
                    order_id: 1,
                    order_number: 1,
                    total_cost: 1,
                    final_cost: 1,
                    item_list: "$order_list.item_details",
                    "item_discounts.total_discount": 1,
                }
            },
            { $unwind: { path: "$item_list" } },
            {
                $project: {
                    order_discount: 1,
                    order_id: 1,
                    order_number: 1,
                    ordered_time: 1,
                    searchdate:1,
                    total_cost: 1,
                    final_cost: 1,
                    "item_discounts.total_discount": 1,
                    "item_list.discount_applied": 1,
                    "item_list.applied_addons": 1,
                    "item_list.price_before_discount": 1,
                    "item_list.discount_detail": 1,
                    "item_list.selling_price" : 1,
                    "item_list.name": 1,
                    "item_list.sold_price": 1,
                    "item_list.quantity" :1,
                }
            },
            {
                $group:
                {
                    _id: "$order_number",
                    order_discount: { $first: "$order_discount" },
                    item_discount_cost: { $first: "$item_discounts.total_discount" },
                    order_id: { $first: "$order_id" },
                    ordered_time: { $first: "$ordered_time" },
                    total_cost: { $first: "$total_cost" },
                    final_cost: { $first: "$final_cost" },
                    item_list:{  $addToSet: "$item_list" },
                }
            }
        ])

        res.status(200).json({
            status: 1,
            data: orderHistory
        })
    } else{
        res.status(401).json({
            status: 0,
            message: 'error getting report',
            error: 'invalid access'
        });
    }
}

exports.getTaxReport = async (req, res) => {
    if (req.accessType === 'superadmin' || req.accessType === 'admin' || req.accessType === 'staffs') {
        let branchId;
        let fromDate = new Date(Number(req.params.fromDate));
        let toDate = new Date(Number(req.params.toDate));
        branchId = req.params.branchId;
        let timezone = req.params.timezonect+"/"+ req.params.timezonearea;
        let billHistory = await CompletedBills.aggregate([
            {
                    
                $addFields: {
                    searchdate: {
                        $toDate:{
                        $dateToString: {
                            date: '$billed_at',
                            timezone: timezone
                        }
                    }
                     }
                    }
            },
            {
                $match: {
                    branch_id: branchId,
                    searchdate: {
                        $gte: fromDate,
                        $lte: toDate
                    }
                }
            },
            {
                $project: {
                    order_discount: 1,
                    // "bills.bill_taxes_details": 1,
                    "bills.bill_tax_amount": 1,
                    "bills._id": 1,
                    "bills.item_list.discount_applied": 1,
                    "bills.item_list.discount_detail": 1,
                    "bills.item_list.name": 1,
                    "bills.item_list.tax_rates": 1,
                    "bills.item_list.selling_price": 1,
                    "bills.item_list.price_before_discount": 1,
                    "bills.item_list.sold_price": 1,
                    "bills.item_list.quantity": 1,
                    "bills.bill_cost": 1,
                    "bills.bill_cost_incl_tax": 1,
                    "bills.bill_final_cost": 1,
                    "billed_at": 1,
                    "searchdate":1
                }
            },
            { $unwind: { path: "$bills" } },            
            { $unwind: { path: "$bills.item_list" } },
            {
                $group: {
                    _id: "$bills._id",
                    total_bill_cost: { 
                        $sum: { 
                            $multiply: [
                                "$bills.item_list.sold_price", 
                                "$bills.item_list.quantity" 
                            ] 
                        } 
                    },
                    "item_list": { $addToSet: "$bills.item_list" },
                    "bill_cost": { $first: "$bills.bill_cost" },
                    "bill_cost_incl_tax": { $first: "$bills.bill_cost_incl_tax" },
                    "bill_final_cost": { $first: "$bills.bill_final_cost" },
                    "billed_at": { $first: "$billed_at" },
                    searchdate:{$first:"$searchdate"}
                    
                }
            },
            {
                $addFields: {
                    "total_order_discount_cost": { $subtract: ["$total_bill_cost", "$bill_cost"] },
                }
            },
            {
                $addFields: {
                    "order_discount_percentage": { 
                        $cond: [
                            { $eq: ["$total_order_discount_cost", 0] }, 0, 
                            { 
                                $multiply: [
                                    { 
                                        $divide: ["$total_order_discount_cost", "$total_bill_cost"] 
                                    }, 
                                    100
                                ]
                            }
                        ]
                        
                    },
                }
            },
            { $unwind: { path: "$item_list" } },
            {
                $project:
                {
                    'new_tax_rates': {
                        $filter: {
                            input: "$item_list.tax_rates",
                            as: "tax_rate",
                            cond: { "$eq": ["$$tax_rate.checked", true] }
                        }
                    },
                    order_discount_cost: 1,
                    total_order_discount_cost: 1,
                    order_discount_percentage: 1,
                    "item_list.discount_applied": 1,
                    "item_list.discount_detail": 1,
                    "item_list.name": 1,
                    "item_list.tax_rates": 1,
                    "item_list.selling_price": 1,
                    "item_list.price_before_discount": 1,
                    "item_list.sold_price": 1,
                    "item_list.quantity": 1,
                    "bill_cost": 1,
                    "bill_cost_incl_tax": 1,
                    "bill_final_cost": 1,
                    "billed_at": 1,
                    searchdate:1
                }
            },
            { 
                $project: {
                    "item_list.tax_rates" : 0       
                }
            },
            { $unwind: { path: "$new_tax_rates" } },
            { 
                $addFields: { 
                    "item_actual_price": {
                        "$cond": {
                            "if": {
                                "$eq": [ "$item_list.discount_applied", true ]
                            },
                            "then": { $multiply: ["$item_list.price_before_discount", "$item_list.quantity" ] },
                            "else": { $multiply: ["$item_list.sold_price", "$item_list.quantity" ] }
                        }
                    },
                    "item_discounted_price": { $multiply: [ "$item_list.sold_price", "$item_list.quantity"] },
                    "applied_item_discount_total": {
                        "$cond": {
                            "if": {
                                "$eq": [ "$item_list.discount_applied", true ]
                            },
                            "then": { 
                                $multiply: [
                                    {
                                        $subtract: [
                                            "$item_list.price_before_discount", 
                                            "$item_list.sold_price" 
                                        ] 
                                    },
                                    "$item_list.quantity"
                                ]
                            },
                            "else": 0
                        }
                    },
                    "tax_amount": {
                        $multiply: [ 
                            {
                                $multiply: [
                                    "$item_list.sold_price", 
                                    { 
                                        $divide: [ 
                                            "$new_tax_rates.percentage", 100 
                                        ] 
                                    } 
                                ]
                            },
                            "$item_list.quantity"
                        ]
                    },
                    "tax_type": "$new_tax_rates.tax_type",
                    "tax_percentage": "$new_tax_rates.percentage",
                    "item_bill_cost": "$bill_cost",
                },
            },
            {
                $addFields: {
                    "order_discount_share_cost": { $multiply: [ "$item_discounted_price", { $divide: [ "$order_discount_percentage",  100] }]  }
                }
            },
            {
                $group: {
                    _id: { 
                        tax_type:"$tax_type", 
                        tax_percentage:"$tax_percentage",
                        days_of_year: { $dayOfYear: "$searchdate" }
                    },
                    "tax_amount": { $sum: "$tax_amount" },
                    "item_actual_price": { $sum: "$item_actual_price" },
                    "item_discounted_price": { $sum: "$item_discounted_price" },
                    "applied_item_discount_total": { $sum: "$applied_item_discount_total" },
                    "applied_item_cost": { $sum: "$total_item_cost" },
                    "billed_at": { $first: "$billed_at" },
                    searchdate:{$first:"$searchdate"},
                    "applied_order_discount_total": { $sum: "$order_discount_share_cost" },
                }
            }
        ])
        
        billHistory = await billHistory.sort((a, b) => b.billed_at - a.billed_at)
        
        res.status(200).json({
            status: 1,
            data: billHistory
        })
    } else{
        res.status(401).json({
            status: 0,
            message: 'error getting report',
            error: 'invalid access'
        });
    }
}
exports.getMemberReport = async (req, res) => {
    if (req.accessType === 'superadmin' || req.accessType === 'admin' || req.accessType === 'staffs') {
        let branchId;
        let fromDate = new Date(Number(req.params.fromDate));
        let toDate = new Date(Number(req.params.toDate));
        let timezone = req.params.timezonect+"/"+ req.params.timezonearea;
        branchId = req.params.branchId;

        OrderHistory.aggregate([
            {
                $addFields: {
                    orderdate: {
                        $toDate: {
                        $dateToString: {
                            date: '$ordered_time',
                            timezone: timezone
                        }
                     }}
                    }
            }, 
            {
                $match: {
                    branch_id: branchId,
                    orderdate: {
                        $gte: fromDate,
                        $lte: toDate
                    },
                    order_status :"completed"

                }
            } ,
            {
                $addFields: {
                    "kot_confirmed": {    
                      
                   
                            $filter: {
                                input: "$order_list",
                                as: "order",
                                cond: { "$eq": ["$$order.order_status", "confirmed"] }
                              
                            }
                        
                    }
                }
            },
           
            { $unwind: { path: "$order_list" } },
            {
                $project: {
                    item_list:  {
                        $filter: {
                            input: "$order_list.item_details",
                            as: "item",
                            cond: { "$eq": ["$$item.item_status", "active"] }
                        }
                    }, 
                    kot_confirmed_by:"$order_list.kot_confirmed_by",
                    order_type:1,
                    total_cost:1,
                    total_cost_after_dicount:1,
                    final_cost:1,
                    grand_total:1,
                    ordered_time:1,
                    orderdate:1,
                    order_discount:1,
                    item_discounts:1,
                    kot_confirmed : 1
                }
            },
            {
                $addFields: {
                    "total_order_discount_cost": {    
                      
                            "$switch": {
                                "branches": [
                                  { "case": { "$eq": [ "$order_discount.discount_type", "amount" ] }, "then": "$order_discount.discount_number" },
                                  { "case":  { $and : [ { "$eq": [ "$order_discount.discount_type", "percentage"  ] },
                                  { "$ne": [ "$order_discount.discount_number", 100  ] }] } , "then": {$multiply:[{$subtract:["$total_cost", "$item_discounts.total_discount"]}, {$divide: ["$order_discount.discount_number",100]}]} },
                                  { "case":  { $and : [ { "$eq": [ "$order_discount.discount_type", "percentage"  ] },
                                  { "$eq": [ "$order_discount.discount_number", 100  ] }] } , "then": {$subtract:["$total_cost", "$item_discounts.total_discount"]} },
                                  { "case": { "$eq": [ "$order_discount.discount_type", "flat" ] }, "then": {$subtract:["$total_cost", "$item_discounts.total_discount"]} },
                                  { "case": { "$eq": [ "$order_discount.discount_type", "new_value"  ] }, "then": {$subtract :[{$subtract:["$total_cost", "$item_discounts.total_discount"]}, "$order_discount.discount_number"]} }
                                ],
                                "default": 0
                              }
                        },
                        'total_item_discounts' : {
                            $sum: [
                                {   
                            $map: {
                                input: "$order_list.item_details",
                                as: "item",
                                in: {          
                                    "$cond": {
                                        "if": {
                                            "$eq": [ "$$item.discount_applied", true ]
                                        },
                                        "then": { $subtract :[{ $multiply: ["$$item.price_before_discount", "$$item.quantity" ]},{ $multiply: ["$$item.sold_price", "$$item.quantity" ]}] },
                                        "else": 0
                                    }                      
                                            }
                                            
                                        
    
                                }
                            }
                        ]
                        }
                  
                }
            },
            // {
            //     $addFields: {
            //         "total_order_discount_cost": { $subtract: ["$total_cost", "$total_cost_after_dicount"] },
            //     }
            // },
          
            { $unwind: { path: "$item_list" } },
            {
                $project:
                {
                    total_item_discounts:1,
                    discount_applied :"$item_list.discount_applied", 
                    discount_detail: "$item_list.discount_detail",
                    name:"$item_list.name",
                    "tax_rates": {
                        $filter: {
                            input: "$item_list.tax_rates",
                            as: "tax_rate",
                            cond: { "$eq": ["$$tax_rate.checked", true] }
                        }
                    },
                    selling_price:"$item_list.selling_price",
                    price_before_discount:"$item_list.price_before_discount",
                    discount_order_price: {
                                "$switch": {
                                    "branches": [
                                      { "case": { "$eq": [ "$order_discount.discount_type", "amount" ] }, "then": {
                                        $multiply:[{ $divide :["$item_list.sold_price",{$add : ["$final_cost","$order_discount.discount_number"]}]},"$final_cost"]}}
                                        ,

                                      { "case": { $and : [ { "$eq": [ "$order_discount.discount_type", "percentage"  ] },{ "$ne": [ "$order_discount.discount_number", 100  ] }] } , "then": {
                                        $multiply:[{ $divide :["$item_list.sold_price",{$divide : ["$final_cost",{ $subtract: [1,{$divide :["$order_discount.discount_number",100]}]}]}]},"$final_cost"]}},
                                    { "case": { $and : [ { "$eq": [ "$order_discount.discount_type", "percentage"  ] },{ "$eq": [ "$order_discount.discount_number", 100  ] }] } , "then": 0 },
                                      { "case": { "$eq": [ "$order_discount.discount_type", "flat" ] }, "then": 0 },
                                      { "case": { "$eq": [ "$order_discount.discount_type", "new_value"  ] }, "then":
                                      {
                                        $multiply:[{ $divide :["$item_list.sold_price",{$subtract:["$total_cost", "$item_discounts.total_discount"]}]},"$final_cost"]}}                                     
                                    ],
                                    "default": "$item_list.sold_price"
                                  }
                        
                        },
                    sold_price: "$item_list.sold_price",
                    quantity: "$item_list.quantity",
                    "total_after_incl_tax":1,
                    kot_confirmed_by:1,
                    order_type:1,
                    total_cost:1,
                    total_cost_after_dicount:1,
                    final_cost:1,
                    grand_total:1,
                    ordered_time:1,
                    orderdate:1,
                    order_discount:1,
                    "total_order_discount_cost":1,
                    kot_confirmed:1
                }
            },
            // { 
            //     $project: {
            //         "item_list.tax_rates" : 1      
            //     }
            // },
            {
                $addFields: { 
                    'new_tax_rates': {
                        $sum: [
                            {   
                        $map: {
                            input: "$tax_rates",
                            as: "output",
                            in: {
                            //    id: "$$output.id",
                            //    CountryName: "$$output.CountryName",
                            
                                $multiply: [ 
                                                {
                                                    $multiply: [
                                                        "$discount_order_price", 
                                                        { 
                                                            $divide: [ 
                                                                "$$output.percentage", 100 
                                                            ] 
                                                        } 
                                                    ]
                                                },
                                                "$quantity"
                                            ]
                                        }
                                        
                                    

                            }
                        }
                    ]
                    },
                    "item_actual_price": {
                        "$cond": {
                            "if": {
                                "$eq": [ "$discount_applied", true ]
                            },
                            "then": { $multiply: ["$price_before_discount", "$quantity" ] },
                            "else": { $multiply: ["$sold_price", "$quantity" ] }
                        }
                    },
                    "item_discounted_price": { $multiply: [ "$discount_order_price", "$quantity"] },
                    "applied_item_discount_total": {
                        "$cond": {
                            "if": {
                                "$eq": [ "$discount_applied", true ]
                            },
                            "then": { 
                                $multiply: [
                                    {
                                        $subtract: [
                                            "$price_before_discount", 
                                            "$sold_price" 
                                        ] 
                                    },
                                    "$quantity"
                                ]
                            },
                            "else": 0
                        }
                    }
                }
            },
            // {
            
            //     $addFields: {
            //         "order_discount_share_cost": { $multiply: [ "$item_discounted_price", { $divide: [ "$order_discount_percentage",  100] }]  }
            //     }
            // },
            {
                $group: {
                    _id: { 
                        "Member_id" : "$kot_confirmed_by"
                        // ,
                        // days_of_year: { $dayOfYear: "$ordered_time"          }
                    },
                    "tax_amount": { $sum: "$new_tax_rates" },
                    "item_total_price": { $sum: "$item_actual_price" },
                    "item_discounted_price": { $sum: "$item_discounted_price" },
                    "item_discount_total": { $sum: "$applied_item_discount_total" },
                    "order_discounted_cost":{$sum :"$total_order_discount_cost"},
                    // "applied_item_cost": { $sum: "$total_item_cost" },  
                    // "applied_order_discount_total": { $sum: "$order_discount_share_cost" },
                    member_id: { $first: "$kot_confirmed_by" },
                    total_kot: { $addToSet:"$kot_confirmed"} ,
                    total_sold_price: { $sum: { $multiply: ["$item_details.quantity", "$item_details.sold_price"] } },
                    total_discount: { $sum:{$subtract : ["$item_actual_price","$item_discounted_price"]} },
                    subtotal : {$sum: "$item_discounted_price" },
                    grand_total : {$sum: {$add : ["$item_discounted_price","$new_tax_rates"]}}
                }
            },
            {
                $lookup:
                {
                    from: "members_directory",
                    localField: "member_id",
                    foreignField: "_id",
                    as: "member_details"
                }
            },
            {$unwind: { path: "$member_details" } },
            {
                $project:
                {
                    'name': "$member_details.name",
                    'position': "$member_details.position",
                    "tax_amount": 1,
                    "item_total_price": 1,
                    "item_discounted_price": 1,
                    "applied_item_discount_total": 1,
                    "order_discounted_cost":1,
                    "applied_item_cost": 1,  
                    "applied_order_discount_total": 1,
                    member_id: 1,
                    total_kot: 1,
                    total_sold_price: 1,
                    total_discount:1,
                    order_discount:1,
                    subtotal:1,
                    grand_total:1
                }
            },
        ], (err, bills) => {
            if (err) {
                console.error({
                    status: 0,
                    message: 'error getting bills',
                    error: err
                })
                res.status(500).json({
                    status: 0,
                    message: 'error getting bills',
                    error: 'problem with the server'
                })
            } else {
                res.status(200).json({
                    status: 1,
                    data: bills
                })
            }
        })
    } else {
        res.status(401).json({
            status: 0,
            message: 'error getting report',
            error: 'invalid access'
        });
    }
}
exports.getTableReport = async (req, res) => {
    if (req.accessType === 'superadmin' || req.accessType === 'admin' || req.accessType === 'staffs') {
        let branchId;
        let fromDate = new Date(Number(req.params.fromDate));
        let toDate = new Date(Number(req.params.toDate));
        let timezone = req.params.timezonect+"/"+ req.params.timezonearea;
        branchId = req.params.branchId;
        OrderHistory.aggregate([
            {
                    
                $addFields: {
                    searchdate: {
                        $toDate:{
                        $dateToString: {
                            date: '$ordered_time',
                            timezone: timezone
                        }
                    }
                     }
                    }
            },
            {
                $match: {
                    branch_id: branchId,
                    searchdate: {
                        $gte: fromDate,
                        $lte: toDate
                    },
                    order_status :"completed"

                }
            } ,
            {
                $addFields: {
                    "kot_confirmed": {    
                      
                       
                            $filter: {
                                input: "$order_list",
                                as: "order",
                                    cond: { "$eq": ["$$order.order_status", "confirmed"] }
                            }
                   
                    }
                }
            },
           
            { $unwind: { path: "$order_list" } },
            {
                $project: {
                    item_list:  {
                        $filter: {
                            input: "$order_list.item_details",
                            as: "item",
                            cond: { "$eq": ["$$item.item_status", "active"] }
                        }
                    }, 
                    table_id:"$table_id",
                    order_type:1,
                    total_cost:1,
                    total_cost_after_dicount:1,
                    final_cost:1,
                    grand_total:1,
                    ordered_time:1,
                    order_discount:1,
                    order_number:1,
                    item_discounts:1,
                    kot_confirmed : 1
                }
            },
            {
                $addFields: {
                    "total_order_discount_cost": {    
                      
                            "$switch": {
                                "branches": [
                                  { "case": { "$eq": [ "$order_discount.discount_type", "amount" ] }, "then": "$order_discount.discount_number" },
                                  { "case":{ $and : [ { "$eq": [ "$order_discount.discount_type", "percentage"  ] },
                                  { "$ne": [ "$order_discount.discount_number", 100  ] }] } , "then": {$multiply:[{$subtract:["$total_cost", "$item_discounts.total_discount"]}, {$divide: ["$order_discount.discount_number",100]}]} },

                                  { "case":{ $and : [ { "$eq": [ "$order_discount.discount_type", "percentage"  ] },
                                  { "$eq": [ "$order_discount.discount_number", 100  ] }] } , "then": {$subtract:["$total_cost", "$item_discounts.total_discount"]} },


                                  { "case": { "$eq": [ "$order_discount.discount_type", "flat" ] }, "then": {$subtract:["$total_cost", "$item_discounts.total_discount"]} },
                                  { "case": { "$eq": [ "$order_discount.discount_type", "new_value"  ] }, "then": {$subtract :[{$subtract:["$total_cost", "$item_discounts.total_discount"]}, "$order_discount.discount_number"]} }
                                ],
                                "default": 0
                              }
                        }
                  
                }
            },
            // {
            //     $addFields: {
            //         "total_order_discount_cost": { $subtract: ["$total_cost", "$total_cost_after_dicount"] },
            //     }
            // },
          
            { $unwind: { path: "$item_list" } },
            {
                $project:
                {
                    discount_applied :"$item_list.discount_applied", 
                    discount_detail: "$item_list.discount_detail",
                    name:"$item_list.name",
                    "tax_rates": {
                        $filter: {
                            input: "$item_list.tax_rates",
                            as: "tax_rate",
                            cond: { "$eq": ["$$tax_rate.checked", true] }
                        }
                    },
                    selling_price:"$item_list.selling_price",
                    price_before_discount:"$item_list.price_before_discount",
                    discount_order_price: {
                                "$switch": {
                                    "branches": [
                                      { "case": { "$eq": [ "$order_discount.discount_type", "amount" ] }, "then": {
                                        $multiply:[{ $divide :["$item_list.sold_price",{$add : ["$final_cost","$order_discount.discount_number"]}]},"$final_cost"]}}
                                        ,
                                      { "case": { $and : [ { "$eq": [ "$order_discount.discount_type", "percentage"  ] }, { "$ne": [ "$order_discount.discount_number", 100  ] }] } , "then": {
                                        $multiply:[{ $divide :["$item_list.sold_price",{$divide : ["$final_cost",{ $subtract: [1,{$divide :["$order_discount.discount_number",100]}]}]}]},"$final_cost"]}},

                                        { "case": { $and : [ { "$eq": [ "$order_discount.discount_type", "percentage"  ] }, { "$eq": [ "$order_discount.discount_number", 100  ] }] } , "then": 0},

                                      { "case": { "$eq": [ "$order_discount.discount_type", "flat" ] }, "then": 0 },
                                      { "case": { "$eq": [ "$order_discount.discount_type", "new_value"  ] }, "then":
                                      {
                                        $multiply:[{ $divide :["$item_list.sold_price",{$subtract:["$total_cost", "$item_discounts.total_discount"]}]},"$final_cost"]}}                                     
                                    ],
                                    "default": "$item_list.sold_price"
                                  }
                        
                        },
                    sold_price: "$item_list.sold_price",
                    quantity: "$item_list.quantity",
                    "total_after_incl_tax":1,
                    table_id:1,
                    order_type:1,
                    total_cost:1,
                    total_cost_after_dicount:1,
                    final_cost:1,
                    grand_total:1,
                    ordered_time:1,
                    order_number:1,
                    order_discount:1,
                    "total_order_discount_cost":1,
                    kot_confirmed:1
                }
            },
            // { 
            //     $project: {
            //         "item_list.tax_rates" : 1      
            //     }
            // },
            {
                $addFields: { 
                    'new_tax_rates': {
                        $sum: [
                            {   
                        $map: {
                            input: "$tax_rates",
                            as: "output",
                            in: {
                            //    id: "$$output.id",
                            //    CountryName: "$$output.CountryName",
                            
                                $multiply: [ 
                                                {
                                                    $multiply: [
                                                        "$discount_order_price", 
                                                        { 
                                                            $divide: [ 
                                                                "$$output.percentage", 100 
                                                            ] 
                                                        } 
                                                    ]
                                                },
                                                "$quantity"
                                            ]
                                        }
                                        
                                    

                            }
                        }
                    ]
                    },
                    "item_actual_price": {
                        "$cond": {
                            "if": {
                                "$eq": [ "$discount_applied", true ]
                            },
                            "then": { $multiply: ["$price_before_discount", "$quantity" ] },
                            "else": { $multiply: ["$sold_price", "$quantity" ] }
                        }
                    },
                    "item_discounted_price": { $multiply: [ "$discount_order_price", "$quantity"] },
                    "applied_item_discount_total": {
                        "$cond": {
                            "if": {
                                "$eq": [ "$discount_applied", true ]
                            },
                            "then": { 
                                $multiply: [
                                    {
                                        $subtract: [
                                            "$price_before_discount", 
                                            "$sold_price" 
                                        ] 
                                    },
                                    "$quantity"
                                ]
                            },
                            "else": 0
                        }
                    }
                }
            },
            {
                $lookup:
                {
                    from: "history_tables",
                    localField: "order_number",
                    foreignField: "order_number",
                    as: "tablehistory"
                }
            },
                
            //   {$unwind: { path: "$tablehistory" } },
            {
                $addFields:
                {
                    'customers': { 
                        $filter: 
                        { 
                          input: "$tablehistory", 
                          as: "tableh", 
                          cond: { $eq: [ "$$tableh.table_id", {$toString: "$table_id"} ] } 
                        } 
                      }
                }
            },
            {
                $group: {
                    _id: { 
                        "Table_id" : "$table_id"
                        // ,
                        // days_of_year: { $dayOfYear: "$ordered_time"          }
                    },

                    "customers":{$addToSet: "$customers" },
                    "tax_amount": { $sum: "$new_tax_rates" },
                    "item_total_price": { $sum: "$item_actual_price" },
                    "item_discounted_price": { $sum: "$item_discounted_price" },
                    "item_discount_total": { $sum: "$applied_item_discount_total" },
                    "order_discounted_cost":{$sum :"$total_order_discount_cost"},
                    // "applied_item_cost": { $sum: "$total_item_cost" },  
                    // "applied_order_discount_total": { $sum: "$order_discount_share_cost" },
                    table_id: { $first: "$table_id" },
                    total_kot: { $addToSet:"$kot_confirmed"} ,
                    total_sold_price: { $sum: { $multiply: ["$item_details.quantity", "$item_details.sold_price"] } },
                    total_discount: { $sum:{$subtract : ["$item_actual_price","$item_discounted_price"]} },
                    subtotal : {$sum: "$item_discounted_price" },
                    grand_total : {$sum: {$add : ["$item_discounted_price","$new_tax_rates"]}}
                    
                    // total_kot: { $addToSet:"$kot_confirmed" },
                    // total_sold_price: { $sum: { $multiply: ["$item_details.quantity", "$item_details.sold_price"] } },
                    // total_discount: { $sum: { $add: ["$applied_item_discount_total", "$total_order_discount_cost"] } },
                    // subtotal : {$sum: {$subtract : ["$item_actual_price",{ $add: ["$applied_item_discount_total", "$total_order_discount_cost"] }]}},
                    // grand_total : {$sum: {$add : [{$subtract : ["$item_actual_price",{ $add: ["$applied_item_discount_total", "$total_order_discount_cost"] }]},"$new_tax_rates"]}}
                }
            },
            {
                $lookup:
                {
                    from: "tables",
                    localField: "table_id",
                    foreignField: "_id",
                    as: "table"
                }
            },
            {$unwind: { path: "$table" } },
            {
                $project:
                {
                    'name': "$table.name",
                    'floor_name': "$table.floor_name",
                    customers:1,
                    "tax_amount": 1,
                    "item_total_price": 1,
                    "item_discounted_price": 1,
                    "applied_item_discount_total": 1,
                    "order_discounted_cost":1,
                    "applied_item_cost": 1,  
                    "applied_order_discount_total": 1,
                    member_id: 1,
                    total_kot: 1,
                    total_sold_price: 1,
                    total_discount:1,
                    order_discount:1,
                    subtotal:1,
                    order_number:1,
                    order_numbers:1,
                    grand_total:1,
                    table_id:1
                }
            },
           
          
        ], (err, bills) => {
            if (err) {
                console.error({
                    status: 0,
                    message: 'error getting bills',
                    error: err
                })
                res.status(500).json({
                    status: 0,
                    message: 'error getting bills',
                    error: 'problem with the server'
                })
            } else {
                res.status(200).json({
                    status: 1,
                    data: bills
                })
            }
        })
    } else {
        res.status(401).json({
            status: 0,
            message: 'error getting report',
            error: 'invalid access'
        });
    }
}

exports.getCustomerTypeSalesReport = (req, res) => {
    res.end('yur customer sales report');
}

exports.getTenderTypeSalesReport = (req, res) => {
    if (req.accessType === 'superadmin' || req.accessType === 'admin' || req.accessType === 'staffs') {
        let branchId;
        let fromDate = new Date(Number(req.params.fromDate));
        let toDate = new Date(Number(req.params.toDate));
        let timezone = req.params.timezonect+"/"+ req.params.timezonearea;
        branchId = req.params.branchId;
        PaymentHistory.aggregate([
            {
                    
                $addFields: {
                    searchdate: {
                        $toDate:{
                        $dateToString: {
                            date: '$paid_at',
                            timezone: timezone
                        }
                    }
                     }
                    }
            },
            {
                $match: {
                    branch_id: branchId,
                    searchdate: {
                        $gte: fromDate,
                        $lte: toDate
                    }
                }
            },
            {
                $group: {
                    _id: { payment_time : '$payment_type', days_of_year: { $dayOfYear: "$searchdate" } },
                    type: { $first: '$payment_type' },
                    branch_id_: { $first: "$branch_id" },
                    count: { $sum: 1 },
                    total_sold_price: { $sum: "$amount_paid" },
                    paid_at: { $first: "$paid_at" }
                }
            }
        ], (err, tenderReport) => {
            if (err) {
                console.error({
                    status: 0,
                    message: 'error getting bills',
                    error: err
                })
                res.status(500).json({
                    status: 0,
                    message: 'error getting bills',
                    error: 'problem with the server'
                })
            } else {
                res.status(200).json({
                    status: 1,
                    data: tenderReport
                })
            }
        })
    } else {
        res.status(401).json({
            status: 0,
            message: 'error getting report',
            error: 'invalid access'
        });
    }
}

exports.getTotalBillCost = (req, res) => {
    
    if (req.accessType === 'superadmin' || req.accessType === 'admin' || req.accessType === 'staffs') {
        let branchId;
        let fromDate = new Date(Number(req.params.fromDate));
        let toDate = new Date(Number(req.params.toDate));
        branchId = req.params.branchId;
        let timezone = req.params.timezonect+"/"+ req.params.timezonearea;
        LiveOrders.aggregate(
        [
            {
                    
                $addFields: {
                    searchdate: {
                        $toDate:{
                        $dateToString: {
                            date: '$ordered_time',
                            timezone: timezone
                        }
                    }
                     }
                    }
            },
            { $match: {
                branch_id: branchId, 
                searchdate : { 
                    $gte:fromDate, 
                    $lte:toDate 
                }
            }
             },
            // { $unwind: '$bills'},
            { $group: 
                {
                    _id: "$branch_id",
                    "total_cost": { $sum: "$grand_total" },
                    "UNSETTLED_ORDERS": { $sum: 1}
                }
            }
        ]
    , (err, bills) => {
            if (err) {
                console.error({
                    status: 0,
                    message: 'error getting bills',
                    error: err
                })
                res.status(500).json({
                    status: 0,
                    message: 'error getting bills',
                    error: 'problem with the server'
                })
            } else {
                res.status(200).json({
                    status: 1,
                    data: bills
                })
            }
        })
    } else {
        res.status(401).json({
            status: 0,
            message: 'error getting report',
            error: 'invalid access'
        });
    }
}

exports.getTotalSaleCost = (req, res) => {
    
    if (req.accessType === 'superadmin' || req.accessType === 'admin' || req.accessType === 'staffs') {
        let branchId;
        let fromDate = new Date(Number(req.params.fromDate));
        let toDate = new Date(Number(req.params.toDate));
        branchId = req.params.branchId;
        let timezone = req.params.timezonect+"/"+ req.params.timezonearea;
        let served_customer_count = 0;
        let deletedQuantity;
        let customer_count;

        HistoryTables.aggregate([
            {
                    
                $addFields: {
                    searchdate: {
                        $toDate:{
                        $dateToString: {
                            date: '$session_started_at',
                            timezone: timezone
                        }
                    }
                     }
                    
                    }
            },
            {
                $match: {
                    branch_id: branchId,
                    searchdate: {
                        $gte: fromDate,
                        $lte: toDate
                    }
                }
            },
            { $unwind: '$table_members'},

        ], (err, userCount) => {
            if (err) {
                console.error({
                    status: 0,
                    message: 'error getting bills',
                    error: err
                })
                res.status(500).json({
                    status: 0,
                    message: 'error getting bills',
                    error: 'problem with the server'
                })
            } else {
                for (let i = 0; i < userCount.length; i++) {
                    served_customer_count += userCount[i].table_members;
                    
                }
        
        CompletedBills.aggregate([
            {
                    
                $addFields: {
                    searchdate: {
                        $toDate:{
                        $dateToString: {
                            date: '$billed_at',
                            timezone: timezone
                        }
                    }
                     }
                    }
            },
            {
                $match: {
                    branch_id: branchId,
                    searchdate: {
                        $gte: fromDate,
                        $lte: toDate
                    }
                }
            },
            { $unwind: { path: "$bills" } },
            {
                $project: {
                    item_list: "$bills.item_list",
                    paid_at:  {
                        $toDate:{
                        $dateToString: {
                            date: '$bills.paid_at',
                            timezone: timezone
                        }
                    }
                },searchdate:1
                }
            },
            { $unwind: { path: "$item_list" } },
            {
                $group: {
                    _id: { $dayOfYear: '$searchdate' },
                    deleted: { $sum: "$item_list.delquantity" },
                    date: { "$first": '$paid_at' },
                }
            }
        ], (err, totalCostReport) => {
            if (err) {
                console.error({
                    status: 0,
                    message: 'error getting bills',
                    error: err
                })
                res.status(500).json({
                    status: 0,
                    message: 'error getting bills',
                    error: 'problem with the server'
                })
            } else {
                deletedQuantity = totalCostReport.length ? totalCostReport[0].deleted : 0;
                
        CustomerModel.aggregate([
            {
                    
                $addFields: {
                    searchdate: {
                        $toDate:{
                        $dateToString: {
                            date: '$created_at',
                            timezone: timezone
                        }
                    }
                     }
                    }
            },
            {
                $match: {
                    branch_id: branchId,
                    searchdate: {
                        $gte: fromDate,
                        $lte: toDate
                    }
                }
            },
            { $count: 'customer_count'}
        ], (err, bills) => {
            if (err) {
                console.error({
                    status: 0,
                    message: 'error getting bills',
                    error: err
                })
                res.status(500).json({
                    status: 0,
                    message: 'error getting bills',
                    error: 'problem with the server'
                })
            } else {
                customer_count = bills.length ? bills[0].customer_count : 0;
                
                CompletedBills.aggregate(
                    [
                        {
                                
                            $addFields: {
                                searchdate: {
                                    $toDate:{
                                    $dateToString: {
                                        date: '$billed_at',
                                        timezone: timezone
                                    }
                                }
                                 }
                                }
                        },
                        { $match: {
                            branch_id: branchId, 
                            searchdate : { 
                                $gte:fromDate, 
                                $lte:toDate 
                            },
                            "bills.bill_status":"paid"
                        }
                         },
                        { $unwind: '$bills'},
                        {    
                            $addFields: { 
                             'total_cost': {
                                 $sum: [
                                     {   
                                 $map: {
                                     input: "$bills.item_list",
                                     as: "item",
                                     in: {          
                                         "$cond": {
                                             "if": {
                                                 "$eq": [ "$$item.discount_applied", true ]
                                             },
                                             "then": { $multiply: ["$$item.price_before_discount", "$$item.quantity" ] },
                                             "else": { $multiply: ["$$item.sold_price", "$$item.quantity" ] }
                                         }                      
                                                 }
                                                 
                                     }
                                 }
                             ]
                             },
                             'total_item_discounts' : {
                                 $sum: [
                                     {   
                                 $map: {
                                     input: "$bills.item_list",
                                     as: "item",
                                     in: {          
                                         "$cond": {
                                             "if": {
                                                 "$eq": [ "$$item.discount_applied", true ]
                                             },
                                             "then": { $subtract :[{ $multiply: ["$$item.price_before_discount", "$$item.quantity" ]},{ $multiply: ["$$item.sold_price", "$$item.quantity" ]}] },
                                             "else": 0
                                         }                      
                                                 }
                                                 
                                     }
                                 }
                             ]
                             },
            
                            
                             "total_order_discount_cost": {    
                                  
                                "$switch": {
                                    "branches": [
                                      { "case": { "$eq": [ "$order_discount.discount_type", "amount" ] }, "then": "$order_discount.discount_number" },
                                      { "case": { $and : [ { "$eq": [ "$order_discount.discount_type", "percentage"  ] },
                                      { "$ne": [ "$order_discount.discount_number", 100  ] }] } , "then": {$multiply:[{$subtract:["$total_cost", "$total_item_discounts"]}, {$divide: ["$order_discount.discount_number",100]}]} },
                                      { "case": { $and : [ { "$eq": [ "$order_discount.discount_type", "percentage"  ] },
                                      { "$eq": [ "$order_discount.discount_number", 100  ] }] } , "then": {$subtract:["$total_cost", "$total_item_discounts"]} },
                                      { "case": { "$eq": [ "$order_discount.discount_type", "flat" ] }, "then": {$subtract:["$total_cost", "$total_item_discounts"]} },
                                      { "case": { "$eq": [ "$order_discount.discount_type", "new_value"  ] }, "then": {$subtract :[{$subtract:["$total_cost", "$total_item_discounts"]}, "$order_discount.discount_number"]} }
                                    ],
                                    "default": 0
                                  }
                            },
                            "void_orders":{
                                $sum: [
                                    {   
                                            "$cond": {
                                            "if": {
                                                "$eq": [ "$order_discount.discount_type", "flat"  ]
                                            },
                                            "then": 1,
                                            "else": 0
                                        }                      
                                                }
                                                   
                            ]
                            }
                         }
                         },
                        { $group: 
                            {
                                _id: "$branch_id",
                                "total_cost": { $sum: "$bills.bill_final_cost" },
                                "net_sales" : { $sum: "$bills.bill_cost"},                  
                                "covers": { $first:served_customer_count },
                                "quantityDelete": { $first: deletedQuantity },
                                "customer_count": { $first: customer_count },
                                "settled_orders": {$sum:1},
                                "total_discount" : {$sum:{$add:["$total_order_discount_cost","$total_item_discounts"]}},
                                "void_orders": {$first:"$void_orders"}
            
                            }
                        }
                    ]
                    , (err, bills) => {
                            if (err) {
                                console.error({
                                    status: 0,
                                    message: 'error getting bills',
                                    error: err
                                })
                                res.status(500).json({
                                    status: 0,
                                    message: 'error getting bills',
                                    error: 'problem with the server'
                                })
                            } else {
                                res.status(200).json({
                                    status: 1,
                                    data: bills
                                })
                            }
                        })
            }
        })
            }
        })
            }
        })
    } else {
        res.status(401).json({
            status: 0,
            message: 'error getting report',
            error: 'invalid access'
        });
    }
}

exports.getNewCustomersCount = (req, res) => {
    if (req.accessType === 'superadmin' || req.accessType === 'admin' || req.accessType === 'staffs') {
        let branchId;
        let fromDate = new Date(Number(req.params.fromDate));
        let toDate = new Date(Number(req.params.toDate));
        branchId = req.params.branchId;
        let timezone = req.params.timezonect+"/"+ req.params.timezonearea;
        CustomerModel.aggregate([
            {
                    
                $addFields: {
                    searchdate: {
                        $toDate:{
                        $dateToString: {
                            date: '$created_at',
                            timezone: timezone
                        }
                    }
                     }
                    }
            },
            {
                $match: {
                    branch_id: branchId,
                    searchdate: {
                        $gte: fromDate,
                        $lte: toDate
                    }
                }
            },
            { $count: 'customer_count'}
        ], (err, bills) => {
            if (err) {
                console.error({
                    status: 0,
                    message: 'error getting bills',
                    error: err
                })
                res.status(500).json({
                    status: 0,
                    message: 'error getting bills',
                    error: 'problem with the server'
                })
            } else {
                res.status(200).json({
                    status: 1,
                    data: bills
                })
            }
        })
    } else {
        res.status(401).json({
            status: 0,
            message: 'error getting report',
            error: 'invalid access'
        });
    }
}

exports.getBestSellerItem = (req, res) => {
    if (req.accessType === 'superadmin' || req.accessType === 'admin' || req.accessType === 'staffs') {
        let branchId;
        let fromDate = new Date(Number(req.params.fromDate));
        let toDate = new Date(Number(req.params.toDate));
        branchId = req.params.branchId;
        let timezone = req.params.timezonect+"/"+ req.params.timezonearea;
        CompletedBills.aggregate([
            {
                    
                $addFields: {
                    searchdate: {
                        $toDate:{
                        $dateToString: {
                            date: '$billed_at',
                            timezone: timezone
                        }
                    }
                     }
                    }
            },
            {
                $match: {
                    branch_id: branchId,
                    searchdate: {
                        $gte: fromDate,
                        $lte: toDate
                    }
                }
            },
            { $unwind: { path: "$bills" } },
            {
                $project: {
                    item_list: "$bills.item_list"
                }
            },
            { $unwind: { path: "$item_list" } },
            {
                $group:
                {
                    _id: "$item_list.name",
                    total_item_sold_quantity: { $sum: "$item_list.quantity" },
                    total_sold_price: { $sum: { $multiply: ["$item_list.quantity", "$item_list.sold_price"] } },
                    category_id: { $first: '$item_list.category_id' }
                }
            },
            { $sort: { "total_item_sold_quantity": -1 } },
            { $limit: 1 }
        ], (err, bills) => {
            if (err) {
                console.error({
                    status: 0,
                    message: 'error getting bills',
                    error: err
                })
                res.status(500).json({
                    status: 0,
                    message: 'error getting bills',
                    error: 'problem with the server'
                })
            } else {
                res.status(200).json({
                    status: 1,
                    data: bills
                })
            }
        })
    } else {
        res.status(401).json({
            status: 0,
            message: 'error getting report',
            error: 'invalid access'
        });
    }
}

exports.getProfit = (req, res) => {
    //TODO: get item sales profit
    if (req.accessType === 'superadmin' || req.accessType === 'admin' || req.accessType === 'staffs') {
        let branchId;
        let fromDate = new Date(Number(req.params.fromDate));
        let toDate = new Date(Number(req.params.toDate));
        branchId = req.params.branchId;
        let timezone = req.params.timezonect+"/"+ req.params.timezonearea;
        HistoryTables.aggregate([
            {
                    
                $addFields: {
                    searchdate: {
                        $toDate:{
                        $dateToString: {
                            date: '$session_started_at',
                            timezone: timezone
                        }
                    }
                     }
                    }
            },
            {
                $match: {
                    branch_id: branchId,
                    searchdate: {
                        $gte: fromDate,
                        $lte: toDate
                    }
                }
            },
            { $unwind: { path: "$members" } },
            { $count: 'served_customer_count'}
        ], (err, userCount) => {
            if (err) {
                console.error({
                    status: 0,
                    message: 'error getting bills',
                    error: err
                })
                res.status(500).json({
                    status: 0,
                    message: 'error getting bills',
                    error: 'problem with the server'
                })
            } else {
                let served_customer_count = userCount.length ? userCount[0].served_customer_count : 0;

                CompletedBills.aggregate(
                    [
                        {
                    
                            $addFields: {
                                searchdatebranch: {
                                    $toDate:{
                                    $dateToString: {
                                        date: '$billed_at',
                                        timezone: timezone
                                    }
                                }
                                 }
                                }
                        },
                        { $match: {
                            branch_id: branchId, 
                            searchdatebranch : { 
                                $gte:fromDate, 
                                $lte:toDate 
                            }
                        }
                         },
                        { $unwind: '$bills'},
                        { $group: 
                            {
                                _id: "$branch_id",
                                "total_cost": { $sum: "$bills.bill_final_cost" }
                            }
                        }
                    ], (err, existingCount) => {
                    let total_cost = existingCount.length ? existingCount[0].total_cost: 0;
                    if (err) {
                        console.error({
                            status: 0,
                            message: 'error getting bills',
                            error: err
                        })
                    }else {
                        let average_cover = total_cost / served_customer_count
                        res.status(200).json({
                            status: 1,
                            data: average_cover
                        })
                    }
                })
            }
        })
    } else {
        res.status(401).json({
            status: 0,
            message: 'error getting report',
            error: 'invalid access'
        });
    }
}

exports.getAverageCover = (req, res) => {
    //TODO: getaverage cover of \
    if (req.accessType === 'superadmin' || req.accessType === 'admin' || req.accessType === 'staffs') {
        let branchId;
        let fromDate = new Date(Number(req.params.fromDate));
        let toDate = new Date(Number(req.params.toDate));
        branchId = req.params.branchId;
        let timezone = req.params.timezonect+"/"+ req.params.timezonearea;
        HistoryTables.aggregate([
            {
                    
                $addFields: {
                    searchdate: {
                        $toDate:{
                        $dateToString: {
                            date: '$session_started_at',
                            timezone: timezone
                        }
                    }
                     }
                    }
            },
            {
                $match: {
                    branch_id: branchId,
                    searchdate: {
                        $gte: fromDate,
                        $lte: toDate
                    }
                }
            },
            { $unwind: { path: "$members" } },
            { $count: 'served_customer_count'}
        ], (err, userCount) => {
            if (err) {
                console.error({
                    status: 0,
                    message: 'error getting bills',
                    error: err
                })
                res.status(500).json({
                    status: 0,
                    message: 'error getting bills',
                    error: 'problem with the server'
                })
            } else {
                let served_customer_count = userCount.length ? userCount[0].served_customer_count : 0;

                CompletedBills.aggregate(
                    [
                        {
                    
                            $addFields: {
                                searchdate: {
                                    $toDate:{
                                    $dateToString: {
                                        date: '$billed_at',
                                        timezone: timezone
                                    }
                                }
                                 }
                                }
                        },
                        { $match: {
                            branch_id: branchId, 
                            searchdate : { 
                                $gte:fromDate, 
                                $lte:toDate 
                            }
                        }
                         },
                        { $unwind: '$bills'},
                        { $group: 
                            {
                                _id: "$branch_id",
                                "total_cost": { $sum: "$bills.bill_final_cost" }
                            }
                        }
                    ], (err, existingCount) => {
                    let total_cost = existingCount.length ? existingCount[0].total_cost: 0;
                    if (err) {
                        console.error({
                            status: 0,
                            message: 'error getting bills',
                            error: err
                        })
                    }else {
                        let average_cover = total_cost / served_customer_count
                        res.status(200).json({
                            status: 1,
                            data: average_cover
                        })
                    }
                })
            }
        })
    } else {
        res.status(401).json({
            status: 0,
            message: 'error getting report',
            error: 'invalid access'
        });
    }
}

exports.getTableTurnOver = (req, res) => {
    //TODO: get turnover of sales of an average table of branch
    if (req.accessType === 'superadmin' || req.accessType === 'admin' || req.accessType === 'staffs') {
        let branchId;
        let fromDate = new Date(Number(req.params.fromDate));
        let toDate = new Date(Number(req.params.toDate));
        branchId = req.params.branchId;
        let timezone = req.params.timezonect+"/"+ req.params.timezonearea;
        HistoryTables.aggregate([
            {
                    
                $addFields: {
                    searchdate: {
                        $toDate:{
                        $dateToString: {
                            date: '$session_started_at',
                            timezone: timezone
                        }
                    }
                     }
                    }
            },
            {
                $match: {
                    branch_id: branchId,
                    session_started_at: {
                        $gte: fromDate,
                        $lte: toDate
                    }
                }
            },
            { $unwind: { path: "$members" } },
            { $count: 'served_customer_count'}
        ], (err, userCount) => {
            if (err) {
                console.error({
                    status: 0,
                    message: 'error getting bills',
                    error: err
                })
                res.status(500).json({
                    status: 0,
                    message: 'error getting bills',
                    error: 'problem with the server'
                })
            } else {
                let served_customer_count = userCount.length ? userCount[0].served_customer_count : 0;

                TablesModel.aggregate([
                    {
                        $match: {
                            branch_id: branchId
                        }
                    },
                    { $count: 'tables_count'}
                ], (err, existingCount) => {
                    let table_count = existingCount.length ? existingCount[0].tables_count: 0;
                    if (err) {
                        console.error({
                            status: 0,
                            message: 'error getting bills',
                            error: err
                        })
                    }else {
                        let table_turnover = served_customer_count / table_count
                        res.status(200).json({
                            status: 1,
                            data: table_turnover
                        })
                    }
                })
            }
        })
    } else {
        res.status(401).json({
            status: 0,
            message: 'error getting report',
            error: 'invalid access'
        });
    }
}

exports.getCustomerRetention = (req, res) => {
    //TODO: get number of returned customers count
    if (req.accessType === 'superadmin' || req.accessType === 'admin' || req.accessType === 'staffs') {
        let branchId;
        let fromDate = new Date(Number(req.params.fromDate));
        let toDate = new Date(Number(req.params.toDate));
        branchId = req.params.branchId;
        let timezone = req.params.timezonect+"/"+ req.params.timezonearea;
        CustomerModel.aggregate([
            {
                    
                $addFields: {
                    searchdate: {
                        $toDate:{
                        $dateToString: {
                            date: '$created_at',
                            timezone: timezone
                        }
                    }
                     }
                    }
            },
            {
                $match: {
                    branch_id: branchId,
                    searchdate: {
                        $gte: fromDate,
                        $lte: toDate
                    }
                }
            },
            { $count: 'customer_count'}
        ], (err, userCount) => {
            if (err) {
                console.error({
                    status: 0,
                    message: 'error getting bills',
                    error: err
                })
                res.status(500).json({
                    status: 0,
                    message: 'error getting bills',
                    error: 'problem with the server'
                })
            } else {
                let new_user_count = userCount.length ? userCount[0].customer_count : 0;

                CustomerModel.aggregate([
                    {
                        $match: {
                            branch_id: branchId
                        }
                    },
                    { $count: 'total_usercount'}
                ], (err, existingCount) => {
                    let total_user_count = existingCount.length ? existingCount[0].total_usercount: 0;
                    if (err) {
                        console.error({
                            status: 0,
                            message: 'error getting bills',
                            error: err
                        })
                    }else {
                        let customer_retention_count = ((total_user_count - new_user_count) / total_user_count)*100
                        res.status(200).json({
                            status: 1,
                            data: customer_retention_count
                        })
                    }
                })
            }
        })
    } else {
        res.status(401).json({
            status: 0,
            message: 'error getting report',
            error: 'invalid access'
        });
    }
}

async function asyncForEach(array, callback) {
	for (let index = 0; index < array.length; index++) {
		await callback(array[index], index, array);
	}
}
