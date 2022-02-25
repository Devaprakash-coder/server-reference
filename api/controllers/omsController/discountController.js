/**
 * NOTE: Discount Controller is a part of Branch Controller
 */
"use strict";
const Bills = require("../../models/omsModels/bill.model");
const Order = require('../../models/omsModels/order.model');
const Table = require("../../models/omsModels/table.model");
const socketController = require("../common/socket.controller");
const mongoose = require('mongoose');

exports.getDiscounts = (req, res) => { };

exports.addDiscount = (req, res) => {
    let updateData = req.body.discount_details;
    let newAmount = req.body.new_price;
    let totalAmount = req.body.new_total;
    let OrderId = updateData.order_id;
    let discountAmount = req.body.discount_amt;
    let orderDetails = updateData.order_list; // TODO: remove this and stop sending this data from front end on applying discount
    //price_before_discount
    /**
     * TODO: Handle 3 types of discounts
     * 1. Discount by Item (requires item ID)
     * 2. Discount by Bill (requires bill ID)
     * 3. Discount by Order (requires order ID)
    */
    if (updateData.item_id && updateData.item_type) {
        /**
         *  TODO: Handle Item Discount
         *  getting data to update
         *  now update in the database
         * */

        Order.findOne({ _id: OrderId }, (err, existingOrder) => {
            console.log("item");
            if (err) {
                // handle error
            } else if (existingOrder) {
                
                let order_price = totalAmount - discountAmount;
                
                let total_after_dicount = totalAmount - discountAmount;
                // let item_pr_ad = updateData.new_price;
                // let total_order_cost_after_discount =  existingOrder.total_cost - discountAmount

                /**
                 * New Codes on adding dicount on orders
                 */

                 let existingItemDiscount = existingOrder.item_discounts;
                 let existingItemDiscountCost = (existingItemDiscount && existingItemDiscount.total_discount) ? existingItemDiscount.total_discount : 0;
                 let existingDiscountedItemCount = (existingItemDiscount && existingItemDiscount.total_items) ? existingItemDiscount.total_items : 0;  
                 let existingDiscountedItems = (existingItemDiscount && existingItemDiscount.discounted_items) ? existingItemDiscount.discounted_items : [];  
                //  let totalItemDiscountCost = existingItemDiscountCost +  (Number(updateData['old_price']) - newAmount);
                 let totalItemDiscountCost = existingItemDiscountCost + (Number(updateData['discount_amount']) );
                
                let alreadyDiscountedItem = existingDiscountedItems.filter((item) => item.item_id == updateData.item_id)

                if(alreadyDiscountedItem.length) {
                    res.status(400).json({
                        status: 0,
                        message: 'Discount already exists',
                        error: 'Invalid Parameters'
                    });
                    return;
                } else {
                    existingDiscountedItems.push({
                        item_id: updateData.item_id,
                        item_cost: updateData.old_price,
                        new_item_cost: updateData.new_price,
                        discounted_amount: updateData.discount_amount
                    })
            
                }

               
                // let oldSetOptions = {
                //     'order_list.$[].item_details.$[item].discount_detail': updateData,
                //     'order_list.$[].item_details.$[item].sold_price': newAmount,
                //     'order_list.$[].item_details.$[item].price_before_discount': updateData['old_price'],
                //     'order_list.$[].item_details.$[item].discount_applied': 1,
                //     'final_cost': order_price
                // } // backup code
        
        
                /**
                * Note: The below code is only used for table orders as for now and will be changed in future for other types of orders too
                */
                let item_details_array = JSON.parse(JSON.stringify(existingOrder.order_list)).map((order) => order.item_details);
                let all_item_list = item_details_array.flat(Infinity);
                let temp_var = 0;
                // all_item_list.forEach((item, j) => {
                //     temp_var = temp_var + ((item.sold_price / totalAmount) * (total_after_dicount)) * .025;
                // });
                let currentTaxRates = [];
                // = ((Item 1 Cost/Total Cost) * (Cost after Discount)) * Item 1 CGST Tax %) + ((Item 2 Cost/Total Cost) * (Cost after Discount)) * Item 2 CGST Tax %)								
                let tax_rates = all_item_list.map((item, k) => {
                  

                    let new_tax_rates = item.tax_rates.filter((tax) => {
                        if(item.item_status != 'removed') {
                        if (tax.checked == true) {
                            tax.item_price = item.sold_price * item.quantity;
        
                            let item_sold_price = item.sold_price;
                            if(item._id == updateData['item_id']) {
                                item_sold_price = updateData['new_price'];
                                let rounded_tax_rate = (( item_sold_price * item.quantity) * (tax.percentage / 100)).toFixed(2);
                               //let rounded_tax_rate = ((((item_sold_price / totalAmount) * (total_after_dicount)) * item.quantity) * (tax.percentage / 100)).toFixed(2);
                                tax.item_gst_price = Number(rounded_tax_rate);
                                tax.item_price = updateData['new_price'] * item.quantity;
                                currentTaxRates.push(tax)
                            }else {
                                let rounded_tax_rate = (( item_sold_price * item.quantity) * (tax.percentage / 100)).toFixed(2);
                                //let rounded_tax_rate = ((((item_sold_price / totalAmount) * (total_after_dicount)) * item.quantity) * (tax.percentage / 100)).toFixed(2);
                                tax.item_gst_price = Number(rounded_tax_rate);
                                // currentTaxRates.push(tax)
                            }
                            //  else {
                            //     // tax.item_gst_price = tax.item_gst_price;
                            //     // let rounded_tax_rate = (((( item_sold_price/ totalAmount) * (total_after_dicount)) * item.quantity) * (tax.percentage / 100)).toFixed(2);
                            // }

                            // let rounded_tax_rate = ((( (item_pr_ad)) * item.quantity) * (tax.percentage / 100)).toFixed(2);
                            // let rounded_tax_rate = (((( item_sold_price/ totalAmount) * (total_after_dicount)) * item.quantity) * (tax.percentage / 100)).toFixed(2);
                            // let rounded_tax_rate = ((((item_sold_price/ totalAmount) * (total_after_dicount)) * item.quantity) * (tax.percentage / 100)).toFixed(2);
                            // tax.item_gst_price = Number(rounded_tax_rate);
                            return tax
                        } else {
                            return false
                        }
                    }
                    })
                    return new_tax_rates;
            
                });
                // = ((Item 1 Cost/Total Cost) * (Cost after Discount)) * Item 1 CGST Tax %) + ((Item 2 Cost/Total Cost) * (Cost after Discount)) * Item 2 CGST Tax %)								
                let tax_rates_array = tax_rates.flat(Infinity);
                let result2 = [];
                tax_rates_array.reduce(function (res, value) {
                    if (!res[value.tax_type]) {
                        // res[value.name] = { name: value.name, item_gst_price: 0,  tax_percentage: value.value };
                        res[value.tax_type] = { tax_type: value.tax_type, item_gst_price: 0, tax_percentage: value.percentage };
                        result2.push(res[value.tax_type])
                    }
                    if(value.item_gst_price) {
                        res[value.tax_type].item_gst_price += value.item_gst_price;
                    }
                    return res;
                }, {});
        
                let order_tax_details = result2;
        

                let total_bill_tax_cost = 0;
                if (order_tax_details.length) {
                    total_bill_tax_cost = order_tax_details
                        .map(tax => {
                            return tax.item_gst_price;
                        })
                        .reduce((a, b) => a + b);
                }
        
                let service_charge_amount = 0;
        
                if (existingOrder.is_applied_service_charge) {
                    service_charge_amount = ((total_after_dicount) * (existingOrder.service_charge_percentage / 100))
                }
        
                let newSetOptions = {
                    'order_list.$[].item_details.$[item].discount_detail': updateData,
                    'order_list.$[].item_details.$[item].sold_price': newAmount,
                    'order_list.$[].item_details.$[item].price_before_discount': updateData['old_price'],
                    'order_list.$[].item_details.$[item].discount_applied': 1,
                    'final_cost': order_price,
                    
                    
                    
                    
                    'order_list.$[].item_details.$[item].tax_rates': currentTaxRates,
                    // new fields to get updated
                    // 'order_discount': updateData,
                    // 'order_list': existingOrder.order_list,
                    // 'final_cost': total_after_dicount,
                    'total_cost_after_dicount': total_after_dicount,  // new
                    'order_tax_details': order_tax_details,
                    'order_tax_amount': total_bill_tax_cost,
                    'service_charge_amount': service_charge_amount,
                    'total_after_incl_tax': total_after_dicount + total_bill_tax_cost,
                    'grand_total': total_after_dicount + total_bill_tax_cost + service_charge_amount,
                    'item_discounts.total_discount': totalItemDiscountCost, 
                    'item_discounts.total_items': existingDiscountedItemCount+1,
                    'item_discounts.discounted_items': existingDiscountedItems
                } // working code
        
                /**
                 * Close of new Code
                 */
        
                const query = { '_id': OrderId }
                // const update = { '$set': oldSetOptions };
                const update = { '$set': newSetOptions }; // new code
                const options = { upsert: true, arrayFilters: [{ 'item._id': mongoose.Types.ObjectId(updateData.item_id) }] };
        
                /**
                 * NOTE: Am using mongoose.Type.ObjectId() method since in database the id's are
                 * stored in mongoose objectId format so to match that am using this function
                 */
        
        
                Order.findOneAndUpdate(query, update, options,
                    (err, result) => {
                        if (err) {
                            console.error({
                                status: 0,
                                message: 'Error Updating Order',
                                error: err
                            });
                            res.status(500).json({
                                status: 0,
                                message: 'Error Updating Order',
                                error: 'Problem with the server'
                            });
                        } else {
                            if (result.table_id) {
                                Table.findOneAndUpdate({ _id: result.table_id }, { $set: { table_amount: newSetOptions.grand_total, total_amount: newSetOptions.grand_total } }, { new: true },
                                    (err, updatedTable) => {
                                    if (err) {
                                        console.error({
                                            status: 0,
                                            message: 'Error updating order',
                                            error: err
                                        });
                                        res.status(404).json({
                                            status: 0,
                                            message: 'Error updating order',
                                            error: 'Problem with the server'
                                        })
                                    } else {
                                        res.status(201).json({
                                            status: 1,
                                            message: 'order updated successfully',
                                        })
        
                                        // socketController.io.sockets.in(branchId).emit("update_table", tableData);
                                        // socketController.io.sockets.in(branchId).emit("update_order", orderData);
        
                                        /**
                                         * Mobile User, let them know that their awaiting order has been confirmed
                                         */
                                        let discountData = {
                                            discount_action: 'add',
                                            discount_reason: updateData.discount_reason,
                                            discount_type: updateData.discount_type,
                                            discount_for: 'item',
                                            product_id: updateData.item_id,
                                            discount_number: updateData.discount_number,
                                            order_id: updateData.order_id,
                                            new_price: updateData.new_price,
                                            discount_amount: updateData.discount_amount,
                                        }

                                        let tableData = {
											floor_id: updatedTable.floor_id
												? updatedTable.floor_id
												: undefined,
											branch_id: existingOrder.branch_id,
											table_id: existingOrder.table_id,
											message: "discount applied successfully",
											order_status: "discount_applied"
										};
                                        socketController.io.sockets.in(existingOrder.branch_id).emit("update_order", tableData);

                                        socketController.io.sockets.in(result.table_id).emit("update_discount", discountData);
                                    }
                                })
                            } else {
                                res.status(201).json({
                                    status: 1,
                                    message: 'order updated successfully'
                                });
                            }
                        }
                    });
            }
        })       

    }

    else if (updateData.order_id) {
        console.log("order");
        Order.findOne({ _id: OrderId }, (err, existingOrder) => {
            if (err) {
                // handle error
            } else if (existingOrder) {
                /**
                 *  NOTE: This Will apply discount to
                 *  the whole order amount independent of the item
                 */
                let total_after_dicount = totalAmount - discountAmount;

                // this.selectedOrderDiscountPrice = this.selectedOrder.final_cost;
                /**
                 * Note: The below code is only used for table orders as for now and will be changed in future for other types of orders too
                 */
                let item_details_array = JSON.parse(JSON.stringify(existingOrder.order_list)).map((order) => order.item_details);
                let all_item_list = item_details_array.flat(Infinity);
                let temp_var = 0;
                // all_item_list.forEach((item, j) => {
                //     temp_var = temp_var + ((item.sold_price / totalAmount) * (total_after_dicount)) * .025;
                // });
                // = ((Item 1 Cost/Total Cost) * (Cost after Discount)) * Item 1 CGST Tax %) + ((Item 2 Cost/Total Cost) * (Cost after Discount)) * Item 2 CGST Tax %)								
                let tax_rates = all_item_list.map((item, k) => {


                    let new_tax_rates = item.tax_rates.filter((tax) => {
                        if(item.item_status != 'removed') {
                        if (tax.checked == true) {
                            tax.item_price = item.sold_price * item.quantity;

                            let rounded_tax_rate = ((((item.sold_price / totalAmount) * (total_after_dicount)) * item.quantity) * (tax.percentage / 100)).toFixed(2);
                            tax.item_gst_price = Number(rounded_tax_rate)
                            return tax
                        } else {
                            return false
                        }
                    }
                    })
                    return new_tax_rates;
              
                });
                // = ((Item 1 Cost/Total Cost) * (Cost after Discount)) * Item 1 CGST Tax %) + ((Item 2 Cost/Total Cost) * (Cost after Discount)) * Item 2 CGST Tax %)								
                let tax_rates_array = tax_rates.flat(Infinity);
                let result2 = [];
                tax_rates_array.reduce(function (res, value) {
                    if (!res[value.tax_type]) {
                        // res[value.name] = { name: value.name, item_gst_price: 0,  tax_percentage: value.value };
                        res[value.tax_type] = { tax_type: value.tax_type, item_gst_price: 0, tax_percentage: value.percentage };
                        result2.push(res[value.tax_type])
                    }
                    res[value.tax_type].item_gst_price += value.item_gst_price;
                    return res;
                }, {});

                let order_tax_details = result2;

                let total_bill_tax_cost = 0;
                if (order_tax_details.length) {
                    total_bill_tax_cost = order_tax_details
                        .map(tax => {
                            return tax.item_gst_price;
                        })
                        .reduce((a, b) => a + b);
                }

                let service_charge_amount = 0;

                if (existingOrder.is_applied_service_charge) {
                    service_charge_amount = ((total_after_dicount) * (existingOrder.service_charge_percentage / 100))
                }

                const query = { '_id': OrderId };
                const newSetOptions = {
                    'order_discount': updateData,
                    'order_list': existingOrder.order_list,
                    'final_cost': total_after_dicount,
                    'total_cost_after_dicount': total_after_dicount,  // new
                    'order_tax_details': order_tax_details,
                    'order_tax_amount': total_bill_tax_cost,
                    'service_charge_amount': service_charge_amount,
                    'total_after_incl_tax': total_after_dicount + total_bill_tax_cost,
                    'grand_total': total_after_dicount + total_bill_tax_cost + service_charge_amount
                }
                const update = {
                    '$set': newSetOptions
                };

                Order.findOneAndUpdate(query, update, (err, result) => {
                    if (err) {
                        console.error({
                            status: 0,
                            message: 'Error Updating Order',
                            error: err
                        });
                        res.status(500).json({
                            status: 0,
                            message: 'Error Updating Order',
                            error: 'Problem with the server'
                        });
                    } else {
                        if (result.table_id) {
                            // TODO: replace here 'total_after_dicount' with 'grand total'
                            Table.findOneAndUpdate({ _id: result.table_id }, { $set: { table_amount: newSetOptions.grand_total, total_amount: newSetOptions.grand_total } }, { new: true },
                                (err, updatedTable) => {
                                if (err) {
                                    console.error({
                                        status: 0,
                                        message: 'Error updating order',
                                        error: err
                                    });
                                    res.status(404).json({
                                        status: 0,
                                        message: 'Error updating order',
                                        error: 'Problwm with the server'
                                    });
                                } else {
                                    res.status(201).json({
                                        status: 1,
                                        message: 'Order Updated Successfully'
                                    });

                                    let discountData = {
                                        discount_action: 'add',
                                        discount_reason: updateData.discount_reason,
                                        discount_type: updateData.discount_type,
                                        discount_for: 'order',
                                        product_id: updateData.order_id,
                                        discount_number: updateData.discount_number,
                                        order_id: updateData.order_id,
                                        new_price: updateData.new_price,
                                        discount_amount: updateData.discount_amount,
                                    }

                                    let tableData = {
                                        floor_id: updatedTable.floor_id
                                            ? updatedTable.floor_id
                                            : undefined,
                                        branch_id: existingOrder.branch_id,
                                        table_id: existingOrder.table_id,
                                        message: "discount applied successfully",
                                        order_status: "discount_applied"
                                    };
                                    socketController.io.sockets.in(existingOrder.branch_id).emit("update_order", tableData);


                                    socketController.io.sockets.in(result.table_id).emit("update_discount", discountData);
                                }
                            })
                        } else {
                            res.status(201).json({
                                status: 1,
                                message: 'Order Updated Successfully'
                            });
                        }
                    }
                });
            } else {
                // handle empty order results
            }
        })
    }
    else if (updateData.bill_id) {
        //TODO: Handle Bill Discount
        // Currently we are not handling scenorio of dicount per bill
    }
};

exports.getDiscount = (req, res) => { };

exports.updateDiscount = (req, res) => {
    //TODO: Handle Total bill discount and item bill discount here
};

exports.removeDiscount = (req, res) => { };
