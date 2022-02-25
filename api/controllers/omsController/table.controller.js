'use strict';
const Table = require('../../models/omsModels/table.model');
const mongoose = require('mongoose');
const socketController = require('../common/socket.controller');
const orderController = require('./order.controller');
const billController = require('./billController');
const Bill = require('../../models/omsModels/bill.model');
const Orders = require('../../models/omsModels/order.model');
const HistoryOrders = require('../../models/history/omsModels/order_history.model');
const HistoryBills = require('../../models/history/omsModels/bill_history.model');
const HistoryTables = require('../../models/history/omsModels/table_history.model');
const QuickService = require('../../models/omsModels/quick_service.model');
const QuickServiceHistory = require('../../models/history/omsModels/quick_services_history.model');
const BranchModel = require('./../../models/branch.model');

/* get tables of company */
exports.getAllTables = (req, res) => {
    Table.find({ 'company_id': req.companyId }, (err, result) => {
        res.send(result)
    })
}

/* get particular table */
exports.getTable = (req, res) => {
    let tableId = req.params.tableId;

    if (!tableId) {
        res.status(400).json({
            status: 0,
            error: 'invalid parameters',
            message: 'table id is required'
        })
    } else {
        Table.findOne({ '_id': tableId })
        .populate('members','visits name email contact_number')
        .exec((err, result) => {
            if (err) {
                res.status(500).json({
                    status: 0,
                    error: 'problem with the server',
                    message: 'no table found'
                })
            } else {
                res.status(200).json({
                    status: 1,
                    data: result,
                    message: 'table obtained successfully'
                })
            }
        })
    }

}


/* get tables of branch */
exports.getCustomerTypes = (req, res) => {
    CustomerMeta.aggregate(
        [
            { $match: { company_id: req.companyId } },
            {
                $addFields: {
                    customer_types: {
                        $filter: {
                            input: "$customer_types",
                            as: "customer_type",
                            cond: { $eq: ["$$customer_type.status", "active"] }
                        }
                    }
                }
            },
            { $project: { member_positions: 0, status: 0 } }
        ],
        (err, customerTypes) => {
            if (err) throw err;
            res.json(customerTypes);
        }
    );
};

exports.getBranchTables = (req, res) => {
    let branch_id = req.params.branchId;
    if (req.params.floorId) {
        Table.aggregate([
            { $match: { $and: [{ 'branch_id': branch_id }, { 'floor_id': req.params.floorId }] } },
        ], (err, result) => {
            if (err) {
                console.error({
                    status: 0,
                    message: 'Error getting branch tables',
                    error: err
                });
                res.status(500).json({
                    status: 0,
                    message: 'Error getting branch tables',
                    error: 'Problem with the server'
                });
            } else {
                function naturalCompare(a, b) {
                    var ax = [], bx = [];

                    a.name.replace(/(\d+)|(\D+)/g, function (_, $1, $2) { ax.push([$1 || Infinity, $2 || ""]) });
                    b.name.replace(/(\d+)|(\D+)/g, function (_, $1, $2) { bx.push([$1 || Infinity, $2 || ""]) });

                    while (ax.length && bx.length) {
                        var an = ax.shift();
                        var bn = bx.shift();
                        var nn = (an[0] - bn[0]) || an[1].localeCompare(bn[1]);
                        if (nn) return nn;
                    }

                    return ax.length - bx.length;
                }
                let new_result = result.sort(naturalCompare);
                res.send(new_result)
            }
        })
    } else {
        Table.find({ 'branch_id': branch_id }, (err, result) => {
            if (err) {
                console.error({
                    status: 0,
                    message: 'Error getting branch details',
                    error: err
                });
                res.status(500).json({
                    status: 0,
                    message: 'Error getting branch details',
                    error: 'Problem with the server'
                });
            } else {
                function naturalCompare(a, b) {
                    var ax = [], bx = [];

                    a.name.replace(/(\d+)|(\D+)/g, function (_, $1, $2) { ax.push([$1 || Infinity, $2 || ""]) });
                    b.name.replace(/(\d+)|(\D+)/g, function (_, $1, $2) { bx.push([$1 || Infinity, $2 || ""]) });

                    while (ax.length && bx.length) {
                        var an = ax.shift();
                        var bn = bx.shift();
                        var nn = (an[0] - bn[0]) || an[1].localeCompare(bn[1]);
                        if (nn) return nn;
                    }

                    return ax.length - bx.length;
                }
                let new_result = result.sort(naturalCompare);
                res.send(new_result)
            }
        })
    }
}

exports.autoAddTable = (req, res) => {
    let tableDetails = req.body.table_details;
    tableDetails['company_id'] = req.companyId;
    tableDetails['branch_id'] = tableDetails.branch_id;
    let table = new Table(tableDetails);
    table.save((err, addedTable) => {
        if (err) {
            console.error({
                status: 0,
                message: 'Error Adding Table',
                error: err
            });
            res.status(500).json({
                status: 0,
                message: 'Error Adding Table',
                error: 'Problem with the server'
            });
        } else {
            res.send(addedTable)
        }
    })
}

exports.addTable = (req, res) => {
    let tableDetails = req.body.table_details;
    tableDetails['company_id'] = req.companyId;
    tableDetails['branch_id'] = tableDetails.branch_id;
    let table = new Table(tableDetails);
    table.save((err, addedTable) => {
        if (err) {
            console.error({
                status: 0,
                message: 'Error Adding Table',
                error: err
            });
            res.status(500).json({
                status: 0,
                message: 'Error Adding Table',
                error: 'Problem with the server'
            });
        } else {
            res.send(addedTable)
        }
    })
}

exports.updateTable = (req, res) => {
    let tableDetail = req.body.table_details;
    Table.findById(tableDetail._id, (err, table_detail) => {
        if (err) {
            console.error({
                status: 0,
                message: 'Error updating Table',
                error: err
            });
            res.status(500).json({
                status: 0,
                message: 'Error updating Table',
                error: 'Problem with the server'
            });
        } else {
            getNextColor(table_detail.branch_id, (color) => {
                tableDetail.table_color = color;
                table_detail.set(tableDetail);
                // TODO need to restrict the returning data
                table_detail.save((err, updatedDetails) => {
                    if (err) {
                        console.error({
                            status: 0,
                            message: 'Error Engaging Table',
                            error: err
                        });
                        res.status(500).json({
                            status: 0,
                            message: 'Error Engaging Table',
                            error: 'Problem with the server'
                        })
                    } else {
                        // socketController.io.sockets.in(branchId).emit('table_occupied_manager', updatedDetails);
                        // create order with empty order list
                        // Orders.findOne({'table_id': tableDetail._id } , (err, orderResult) => { 
                        //     if (err) {
                        //         console.error({
                        //           status: 0,
                        //           message: "Error Finding Order for the table id",
                        //           error: err
                        //         });
                        //         res.status(500).json({
                        //             status: 0,
                        //             message: "Error Finding Order for the table id",
                        //             error: 'problem with the server'
                        //         });
                        //     } else if (orderResult) {
                        //         console.error({
                        //             status: 0,
                        //             message: "Order already exists fot this table",
                        //             error: 'invalid parameters'
                        //           });
                        //           res.status(500).json({
                        //               status: 0,
                        //               message: "Order already exists fot this table",
                        //               error: 'invalid parameters'
                        //             });
                        //     } else {                                
                        //         let order = new Orders();
                        //         order.branch_id = table_detail.branch_id;
                        //         order.table_id = tableDetail._id;
                        //         order.order_id = null;
                        //         order.delivery_id = null;
                        //         order.total_cost = 0;
                        //         order.final_cost = 0;
                        //         order.order_type = 'in_house';
                        //         order.people_in_order.push( { name: 'pravin', user_id: '123' } );

                        //         order.save((err, savedOrder) => {
                        //             if (err) {
                        //                 console.error({
                        //                 status: 0,
                        //                 message: "Error saving Order",
                        //                 error: err
                        //                 });
                        //                 res.status(500).json({
                        //                 status: 0,
                        //                 message: "Error Saving Order",
                        //                 error: "Problem with the server"
                        //                 });
                        //             }else {
                        //                 let tableData = {
                        //                     branch_id: table_detail.branch_id,
                        //                     table_id: tableDetail._id,
                        //                     floor_id: table_detail.floor_id,
                        //                     order_status: "placed"
                        //                 };
                        //                 socketController.io.sockets.in(table_detail.branch_id).emit('update_table', tableData)
                        //                 res.status(200).json({
                        //                     status: 1,
                        //                     message: 'Table Engaged Successfully',
                        //                 });    
                        //             }
                        //         })

                        //     }
                        // })

                        let branchId;
                        branchId = updatedDetails.branch_id;
                        socketController.io.sockets.in(branchId).emit('update_table', updatedDetails)
                        res.status(200).json({
                            status: 1,
                            message: 'Table Engaged Successfully',
                        });
                    }
                });
            })
        }
    })
}

/**
 * ACTION: Remove Table from the branch
 */
exports.removeTable = (req, res) => {
    let tableDetail = req.body.table_details;
    Table.findById(tableDetail._id, (err, table_detail) => {
        if (err) {
            return handleError(err);
        }
        table_detail.set({ 'table_status': tableDetail.status });
        //TODO need to restrict the returning data
        table_detail.save((err, updatedDetails) => {
            if (err) return handleError(err);
            res.send(updatedDetails);
        });
    })
}

/**
 * ACTION: Reset new Order status
 */
exports.resetTableAlert = (req, res) => {
    let tableDetails = req.body.table_details;
    let status = tableDetails.status;
    Table.findOneAndUpdate({ _id: tableDetails._id }, { $set: { has_alert: status } }, (err, updatedresult) => {
        if (err) {
            console.error({
                status: 0,
                message: 'Error updating Table',
                error: err
            })
            res.status(500).json({
                status: 0,
                message: 'Error updating Table',
                error: 'Problem with the server'
            })
        } else {
            res.status(201).json({
                status: 1,
                message: 'Table Updated successfully'
            })
        }
    })
}


exports.unmergeTable = (req, res) => {
    let tableDetail = req.body.table_details;
    let childTable = tableDetail.child;
    let parentTable = tableDetail.parent;

    Orders.findOne({ table_id: parentTable._id }, async (err, orderDetail) => {
        if (err) {
            res.status(404).send({
                status: 0,
                message: 'please check the parameter',
                error: 'no order found',
            })
        } else if(!orderDetail) {

            let TableToUnmerge = new Table(childTable);
            TableToUnmerge.parent_table = true;
            TableToUnmerge.total_members = childTable.members.length;
            TableToUnmerge.table_members = childTable.members.length;
            TableToUnmerge.session_status = "active";
            TableToUnmerge.session_started_at = parentTable.session_started_at;

            try {
                await Table.findOne({_id:childTable._id }).then((child) =>{
                    child.set(TableToUnmerge);
                    child.save();
                })
                await Table.findOne({_id:parentTable._id }).then((parent) =>{
                    parent.set(parentTable);
                    parent.save();
                })
                res.status(201).send({
                    status: 1,
                    message: 'table updated successfully'
                })
            }catch(err) {
                res.status(500).send({
                    status: 0,
                    message: 'error updating table',
                    error: "problem with the server"
                })
            }
        }else {
            let childTableItems = []
            orderDetail.order_list.forEach((kot, i) => {
                kot.item_details.forEach((item, j) => {
                    if (item && item.from_table_id && item.from_table_id == childTable._id) {
                        childTableItems.push(item);
                        delete kot.item_details[j]
                    }
                })
            });

            let total_cost = 0;
            let final_cost = 0;
            let parentItemList = orderDetail.order_list.map(kot => {
                if (kot.item_details) {
                    return kot.item_details
                }
            }).flat();

            //TODO: Handle parent awaiting items
            orderDetail.order_list.forEach((kot) => {
                kot.item_details.forEach((item, i) => {
                    final_cost += item.sold_price * item.quantity;
                    total_cost += (item.selling_price * item.quantity);
                })
            })

            let item_discounts = await calculateItemDiscounts(parentItemList)
            let order_discount_amount = await calculateOrderDiscountsAmount(orderDetail, final_cost)
            let order_tax_details = await calculateOrderTaxDetails(orderDetail, parentItemList);
            let order_tax_cost = 0;
            if (order_tax_details.length) {
                order_tax_cost = order_tax_details
                    .map(tax => {
                        return tax.item_gst_price;
                    })
                    .reduce((a, b) => a + b);
            }
            let total_cost_after_dicount = final_cost - order_discount_amount - (item_discounts.total_discount ? item_discounts.total_discount : 0)
            let service_charge_cost = Number(Number(await getServiceCharge(orderDetail, total_cost_after_dicount)).toFixed(2));
            async function getServiceCharge(currentOrder, cost_after_discounts) {
                let service_charge_amount = 0
                if (currentOrder.is_applied_service_charge) {
                    service_charge_amount = cost_after_discounts * (currentOrder.service_charge_percentage / 100);
                    return service_charge_amount
                }
            }

            let hasParentAwaitingOrder = false;

            let new_order_list = orderDetail.order_list.filter((kot) => {
                kot.item_details = kot.item_details.filter((item, i) => {
                    if(item.item_status === 'ordered') {
                        hasParentAwaitingOrder = true;
                    }
                    return item !== null
                });
                if (kot.item_details && kot.item_details.length > 0) {
                    return kot
                }
            });

            let parentSetOptions = {
                "item_discounts": item_discounts,
                "order_status": "confirmed",
                "offer_applied": false,
                "order_tax_details": order_tax_details,
                "order_tax_amount": order_tax_cost,
                "total_cost": total_cost,
                "final_cost": final_cost,
                "order_list": new_order_list,
                "grand_total": total_cost_after_dicount + service_charge_cost + order_tax_cost,
                "service_charge_amount": service_charge_cost,
                "total_after_incl_tax": total_cost_after_dicount + order_tax_cost,
                "total_cost_after_dicount": total_cost_after_dicount
            }

            await Orders.update({ _id: orderDetail._id }, { $set: parentSetOptions }, (err, updatedParentOrder) => {
                //TODO: remove this handling in future
                if (err) {
                    return err
                } else {
                    return updatedParentOrder
                }
            })

            await removeChildFromParentTable(parentSetOptions.grand_total);
            await placeChildsOrder(orderDetail, childTableItems)

            async function removeChildFromParentTable(total_cost) {
                return await Table.update(
                    { "_id": parentTable._id },
                    {
                        $pull: { "merged_with": { table_id: childTable._id } },
                        $set: { 'table_amount': total_cost, 'total_amount': total_cost,"has_alert" : hasParentAwaitingOrder }
                    },
                    (err, updatedTable) => {
                        if (err) {
                            return err;
                        } else {
                            return updatedTable;
                        }
                    })
            }

            async function placeChildsOrder() {
                let c_final_cost = 0;
                let c_total_cost = 0;
                let hasChildAwaitingOrder = false;
                childTableItems.forEach((item, i) => {
                    //TODO: Handle child table item awaiting
                    if(item.item_status === 'ordered') {
                        hasChildAwaitingOrder = true;
                    }
                    if(item.item_status !== 'ordered') {
                        c_final_cost += item.sold_price * item.quantity;
                        c_total_cost += (item.selling_price * item.quantity);
                    }
                })
                let c_item_discounts = await calculateItemDiscounts(childTableItems)
                let c_order_discount_amount = 0; //may be in future it will be moded as split order discount
                let c_order_tax_details = await calculateOrderTaxDetails(orderDetail, childTableItems);
                let c_order_tax_cost = 0;
                if (c_order_tax_details.length) {
                    c_order_tax_cost = c_order_tax_details
                        .map(tax => {
                            return tax.item_gst_price;
                        })
                        .reduce((a, b) => a + b);
                }
                let c_total_cost_after_dicount = c_final_cost - c_order_discount_amount - (c_item_discounts.total_discount ? c_item_discounts.total_discount : 0)
                let c_service_charge_cost = Number(Number(await getServiceCharge(orderDetail, c_total_cost_after_dicount)).toFixed(2));

                let kot_number = await orderController.updateCount(orderDetail.branch_id, 'kot', orderDetail.order_type)
               
                // let order_number = await orderController.updateCount(orderDetail.branch_id, 'order', orderDetail.order_type)
                let order_count = await orderController.updateCount(orderDetail.branch_id, 'order', orderDetail.order_type)
                order_number = order_count.new_order_count;
                order_type_number = order_count.new_order_type_count;


                let order = new Orders({
                    "item_discounts": c_item_discounts,
                    "order_status": "confirmed",
                    "offer_applied": false,
                    "order_tax_details": c_order_tax_details,
                    "order_tax_amount": c_order_tax_cost,
                    "total_cost": c_total_cost,
                    "final_cost": c_final_cost,
                    "grand_total": c_total_cost_after_dicount + c_service_charge_cost + c_order_tax_cost,
                    "service_charge_amount": c_service_charge_cost,
                    "total_after_incl_tax": c_total_cost_after_dicount + c_order_tax_cost,
                    "total_cost_after_dicount": c_total_cost_after_dicount,
                    "has_alert": false,
                    "table_id": childTable._id,
                    "order_type": orderDetail.order_type,
                    "branch_id": orderDetail.branch_id,
                    "order_list": [
                        {
                            "order_status": hasChildAwaitingOrder ? "placed" : "confirmed",
                            "item_details": childTableItems,
                            "kot_number": kot_number //this should be dinamic
                        }
                    ],
                    "ordered_time": orderDetail.ordered_time,
                    "is_applied_service_charge": orderDetail.is_applied_service_charge,
                    "service_charge_percentage": orderDetail.service_charge_percentage,
                    "order_number": order_number, // this should be dinamic
                    "order_type_number": order_type_number // this should be dinamic
                });

                order.save((err, savedOrder) => {
                    //TODO:remove this handing in future
                    if (err) {
                        return err;
                    } else {
                        return savedOrder
                    }
                })

                await resetChildTable(order.grand_total, hasChildAwaitingOrder)
            }

            async function resetChildTable(table_amount, tableAlert) {
                let setOptions = {
                    "table_amount": table_amount,
                    "total_amount": table_amount,
                    "merged_to": [],
                    "parent_table": true,
                    "child_table": false,
                    "child_of": [],
                    "has_alert": tableAlert,
                    "session_started_at": parentTable.session_started_at || Date.now()
                };

                await Table.update({ _id: childTable._id }, { $set: setOptions }, (err, savedTable) => {
                    if (err) {
                        return err;
                    } else {
                        return savedTable
                    }
                });

                res.status(201).send({
                    status: 1,
                    message: 'table updated successfully'
                })
            }

            async function calculateItemDiscounts(itemList) {
                let discountedItems = [];
                let totalDiscount = 0;
                let totalItems = 0;
                itemList.forEach(item => {
                    if (item.discount_applied) {
                        discountedItems.push({
                            "item_id": item._id,
                            "item_cost": item.selling_price * item.quantity,
                            "new_item_cost": item.sold_price * item.quantity,
                            "discounted_amount": (item.selling_price - item.sold_price) * item.quantity
                        });
                        totalItems++
                        totalDiscount += (item.selling_price - item.sold_price) * item.quantity
                    }
                })

                if (totalItems > 0) {
                    return {
                        "discounted_items": discountedItems,
                        "total_discount": totalDiscount,
                        "total_items": totalItems
                    }
                } else {
                    return {}
                }
            }

            async function calculateOrderDiscountsAmount(currentOrder, totalCost) {
                //calcuate taxes after all the discounts
                let order_discount_amount = 0;
                if (currentOrder.order_discount && currentOrder.order_discount.discount_type) {
                    let total_cost_after_discount = 0;
                    if (currentOrder.order_discount.discount_type === "amount") {
                        let discount_amount = currentOrder.order_discount.discount_number;
                        total_cost_after_discount = totalCost - discount_amount;
                    } else if (currentOrder.order_discount.discount_type === "percentage") {
                        total_cost_after_discount = totalCost - (totalCost * (currentOrder.order_discount.discount_number / 100));
                    } else if (currentOrder.order_discount.discount_type === "new_value") {
                        total_cost_after_discount = currentOrder.order_discount.discount_number;
                    } else if (currentOrder.order_discount.discount_type === "flat") {
                        total_cost_after_discount = 0;
                    }
                    order_discount_amount = totalCost - total_cost_after_discount;
                    return order_discount_amount;
                } else {
                    return order_discount_amount;
                }
            }

            async function calculateOrderTaxDetails(currentOrder, itemList) {
                // calculate order discounts array priority 2 after
                if (currentOrder.order_tax_details && currentOrder.order_tax_details.length) {
                    let tax_rates = itemList.map((item, k) => {
                      

                        let new_tax_rates = item.tax_rates.filter((tax) => {
                            if(item.item_status != 'removed') {
                            if (tax.checked == true) {
                                tax.item_price = item.sold_price * item.quantity;
                                let item_sold_price = item.sold_price;
                                let rounded_tax_rate = ((((item_sold_price / totalCost) * (total_cost_after_discount)) * item.quantity) * (tax.percentage / 100)).toFixed(2);
                                tax.item_gst_price = Number(rounded_tax_rate);
                                return tax
                            } else {
                                return false
                            }
                        }
                        })
                        return new_tax_rates;
                   
                    });

                    let tax_rates_array = tax_rates.flat(Infinity);

                    let result2 = [];
                    tax_rates_array.reduce(function (res, value) {
                        if (!res[value.tax_type]) {
                            res[value.tax_type] = { tax_type: value.tax_type, item_gst_price: 0, tax_percentage: value.percentage };
                            result2.push(res[value.tax_type])
                        }
                        if (value.item_gst_price) {
                            res[value.tax_type].item_gst_price += value.item_gst_price;
                        }
                        return res;
                    }, {});

                    let order_tax_details = result2;
                    return order_tax_details;
                } else {
                    return []
                }
            }
        }
    })
}


//new code mergeTable
exports.mergeTable = (req, res) => {
    let tableDetail = req.body.table_details;
    let childTable = tableDetail.child;
    let parentTable = tableDetail.parent;

    if (childTable['session_status'] === 'inactive') {
        childTable["table_color"] = undefined;
    }

    let OtherTableList = parentTable.merged_with.map((mergedTable) => {
        let temp_var = new mongoose.mongo.ObjectId(mergedTable.table_id);
        if (temp_var != tableDetail.last_table_id) {
            return temp_var
        }
    });

    let parentId = new mongoose.mongo.ObjectId(parentTable['_id']);

    Table.findById(childTable._id, (err, returnedChild) => {
        if (err) {
            console.error({
                status: 0,
                message: 'Error finding table',
                error: err
            });
            res.status(500).json({
                status: 0,
                message: 'Error finding table',
                error: 'Problem with the server'
            })
        } else {
            returnedChild.set(childTable);
            //TODO need to restrict the returning data
            returnedChild.save((err, updatedChild) => {
                if (err) {
                    console.error({
                        status: 0,
                        message: 'Error updating table',
                        error: err
                    });
                    res.status(500).json({
                        status: 0,
                        message: 'Error updating table',
                        error: 'Problem with the server'
                    });
                }
                else {
                    Table.findOneAndUpdate({ "_id": parentId }, { $set: { "table_members": parentTable.table_members, merged_with: parentTable.merged_with, parent_of: parentTable.merged_with } }, (err, UpdatedParent) => {
                        if (err) {
                            console.error({
                                status: 0,
                                message: 'Error Merging table',
                                error: err
                            });
                            res.status(500).json({
                                status: 0,
                                message: 'Error Merging table',
                                error: 'Problem with the server'
                            });
                        }
                        else if (OtherTableList) {
                            Table.updateMany(
                                { "_id": { "$in": OtherTableList } },
                                { $set: { "table_members": parentTable.table_members } },
                                ((err, updatedresult) => {
                                    if (err) {
                                        console.error({
                                            status: 0,
                                            message: 'Error Merging tables',
                                            error: err
                                        });
                                        res.status(500).json({
                                            status: 0,
                                            message: 'Error Merging tables',
                                            error: 'Problem with the server'
                                        });
                                    } else if (tableDetail.last_table_members) {
                                        let member_id = new mongoose.mongo.ObjectId(tableDetail.last_table_id);
                                        Table.update({ _id: member_id }, { table_members: tableDetail.last_table_members }, (err, updatedTable) => {
                                            if (err) {
                                                console.error({
                                                    status: 0,
                                                    message: 'Error merging table',
                                                    error: err
                                                });
                                                res.status(500).json({
                                                    status: 0,
                                                    message: 'Error merging table',
                                                    error: 'Problem with the server'
                                                });
                                            }
                                            else {
                                                // socketController.io.sockets.in(branchId).emit('table_merged_manager', tableDetail);
                                                // if(req.accessType === 'admin') {
                                                socketController.io.sockets.in(returnedChild.branch_id).emit('update_table', tableDetail)
                                                // }
                                                res.send(updatedTable);
                                            }
                                        })
                                    } else {
                                        // socketController.io.sockets.in(branchId).emit('table_merged_manager', tableDetail)
                                        // socketController.io.sockets.in(branchId).emit('update_table', tableDetail);
                                        if (req.accessType === 'admin' || req.accessType === 'staffs') {
                                            socketController.io.sockets.in(returnedChild.branch_id).emit('update_table', tableDetail)
                                        }
                                        res.send(updatedresult);
                                    }
                                })
                            )
                        } else {
                            res.status(200).json({
                                status: 1,
                                message: 'Table Updated Successfully'
                            });
                        }
                    })
                }
            });
        }
    })
}

//backup code mergeTable
exports.mergeTable = (req, res) => {
    let tableDetail = req.body.table_details;
    let childTable = tableDetail.child;
    let parentTable = tableDetail.parent;

    if (childTable['session_status'] === 'inactive') {
        childTable["table_color"] = undefined;
    }

    // let roundOfTableValue = Math.round(parentTable.total_members/ (parentTable.merged_with.length + 1));

    // childTable.table_members = (parentTable.total_members - ( roundOfTableValue * (parentTable.merged_with.length) ));
    // childTable.total_members = childTable.table_members;

    // parentTable.table_members = roundOfTableValue;

    let OtherTableList = parentTable.merged_with.map((mergedTable) => {
        let temp_var = new mongoose.mongo.ObjectId(mergedTable.table_id);
        if (temp_var != tableDetail.last_table_id) {
            return temp_var
        }
    });

    let parentId = new mongoose.mongo.ObjectId(parentTable['_id']);

    Table.findById(childTable._id, (err, returnedChild) => {
        if (err) {
            console.error({
                status: 0,
                message: 'Error finding table',
                error: err
            });
            res.status(500).json({
                status: 0,
                message: 'Error finding table',
                error: 'Problem with the server'
            })
        } else {
            returnedChild.set(childTable);
            //TODO need to restrict the returning data
            returnedChild.save((err, updatedChild) => {
                if (err) {
                    console.error({
                        status: 0,
                        message: 'Error updating table',
                        error: err
                    });
                    res.status(500).json({
                        status: 0,
                        message: 'Error updating table',
                        error: 'Problem with the server'
                    });
                }
                else {
                    Table.findOneAndUpdate({ "_id": parentId }, { $set: { "table_members": parentTable.table_members, merged_with: parentTable.merged_with, parent_of: parentTable.merged_with } }, (err, UpdatedParent) => {
                        if (err) {
                            console.error({
                                status: 0,
                                message: 'Error Merging table',
                                error: err
                            });
                            res.status(500).json({
                                status: 0,
                                message: 'Error Merging table',
                                error: 'Problem with the server'
                            });
                        }
                        else if (OtherTableList) {
                            Table.updateMany(
                                { "_id": { "$in": OtherTableList } },
                                { $set: { "table_members": parentTable.table_members } },
                                ((err, updatedresult) => {
                                    if (err) {
                                        console.error({
                                            status: 0,
                                            message: 'Error Merging tables',
                                            error: err
                                        });
                                        res.status(500).json({
                                            status: 0,
                                            message: 'Error Merging tables',
                                            error: 'Problem with the server'
                                        });
                                    } else if (tableDetail.last_table_members) {
                                        let member_id = new mongoose.mongo.ObjectId(tableDetail.last_table_id);
                                        Table.update({ _id: member_id }, { table_members: tableDetail.last_table_members }, (err, updatedTable) => {
                                            if (err) {
                                                console.error({
                                                    status: 0,
                                                    message: 'Error merging table',
                                                    error: err
                                                });
                                                res.status(500).json({
                                                    status: 0,
                                                    message: 'Error merging table',
                                                    error: 'Problem with the server'
                                                });
                                            }
                                            else {
                                                // socketController.io.sockets.in(branchId).emit('table_merged_manager', tableDetail);
                                                // if(req.accessType === 'admin') {
                                                socketController.io.sockets.in(returnedChild.branch_id).emit('update_table', tableDetail)
                                                // }
                                                res.send(updatedTable);
                                            }
                                        })
                                    } else {
                                        // socketController.io.sockets.in(branchId).emit('table_merged_manager', tableDetail)
                                        // socketController.io.sockets.in(branchId).emit('update_table', tableDetail);
                                        if (req.accessType === 'admin' || req.accessType === 'staffs') {
                                            socketController.io.sockets.in(returnedChild.branch_id).emit('update_table', tableDetail)
                                        }
                                        res.send(updatedresult);
                                    }
                                })
                            )
                        } else {
                            res.status(200).json({
                                status: 1,
                                message: 'Table Updated Successfully'
                            });
                        }
                    })
                }
            });
        }
    })
}

// Getting floor list by branch id
exports.getFloorList = (req, res) => {

    let branch_id = req.params.branchId;
    // Table.aggregate(  [
    //     // Matchin condition
    //     { "$match": { "branch_id": branch_id  } },
    //     // Grouping pipeline
    //     // { "$group": { 
    //     //     "_id": '$floor_id'  
    //     // }},
    // ],
    BranchModel.findOne({ _id: branch_id },
        { _id: 1, name: 1, table_plans: 1 },
        (err, result) => {
            if (err) {
                console.error(err);
            } else {
                res.send(result);
            }
        })
}

// Getting floor list by branch id
exports.getTablesOfFloor = (req, res) => {

    let floor_id = req.params.floorId;

    Table.aggregate([
        { $match: { floor_id: floor_id } },
        {
            $group: {
                _id: "$floor_id",
                floor_id: { $first: "$floor_id" },
                floor_name: { $first: "$floor_name" },
                tables_list: {
                    $push: {
                        table_id: "$_id",
                        table_name: "$name"
                    },
                }
            }
        },
    ],
        (err, result) => {
            if (err) {
                console.error(err);
            } else {
                res.send(result);
            }
        })
}

exports.getTablesByBranchAndFloor = (req, res) => {
    let branch_id = req.params.branchId;
    let floor_id = req.params.floorId;

    Table.find({ 'branch_id': branch_id, 'floor_id': floor_id }, (err, result) => {
        if (err) {
            console.error({
                status: 0,
                message: 'error getting tables',
                error: err
            });
            res.status(500).send({
                status: 0,
                message: 'error getting tables',
                error: 'problem with the server'
            });
        } else {
            res.send(result);
        }
    })
}

async function getNextColor(branchId, next) {
    let colors = ["radio-red", "passcode-pink", "podcast-purple", "bookmark-blue", "bluetooth-blue", "gateway-green", "greenfield-green", "overwrite-orange", "backlink-brown", "gigabyte-grey"];
    await Table.find({ branch_id: branchId, parent_table: true }, (err, branches) => {
        if (err) {
            console.error({
                status: 0,
                message: 'Error Finding table',
                error: err
            });
            // res.status(500).json({
            //     status: 0,
            //     message: 'Error Finding table',
            //     error: 'Problem with the server'
            // });
            next(err)
        } else {
            let ParentTableCount = null;
            let branchCount = branches.length;
            if (branchCount < 10) {
                ParentTableCount = branchCount;
            } else {
                ParentTableCount = (branchCount % 10)
            }
            // We here have  10 choices to select. So,
            if (ParentTableCount == 0) {
                next(colors[0]);
            } else if (ParentTableCount == 1) {
                next(colors[1]);
            } else if (ParentTableCount == 2) {
                next(colors[2])
            } else if (ParentTableCount == 3) {
                next(colors[3]);
            } else if (ParentTableCount == 4) {
                next(colors[4]);
            } else if (ParentTableCount == 5) {
                next(colors[5]);
            } else if (ParentTableCount == 6) {
                next(colors[6]);
            } else if (ParentTableCount == 7) {
                next(colors[7])
            } else if (ParentTableCount == 8) {
                next(colors[8]);
            } else if (ParentTableCount == 9) {
                next(colors[9]);
            }
        }
    })
}

exports.getNextColor = getNextColor;
/**
 * Action: Reinititalize table
 * END Session
 */
exports.resetTable = (req, res) => {
    let tableDetail = req.body.table_details;
    resetOrder(tableDetail._id).then((orderResetResult) => {
        resetBill(orderResetResult.orderId).then((SubmittedBill) => {
            resetQuickService(tableDetail._id).then((submittedService) => {
                tableDetail['order_number'] = orderResetResult.orderNumber;
                resetTable(tableDetail).then((result) => {
                    if (result._id) {
                        let tableData = {
                            table_id: result._id,
                            floor_id: result.floor_id,
                            branch_id: result.branch_id,
                            order_status: 'session_closed'
                        }
                        socketController.io.sockets.in(result._id).emit('update_table', tableData);
                        socketController.io.sockets.in(result.branch_id).emit('update_table', tableData);
                    }
                    res.status(200).json({
                        status: 1,
                        message: 'Table reset successfully'
                    })
                }).catch((err) => {
                    console.error({
                        status: 0,
                        message: 'Error resetting table',
                        error: err
                    })
                    res.status(401).json({
                        status: 0,
                        message: 'Error resetting table',
                    })
                });
            }).catch((err) => {
                console.error({
                    status: 0,
                    message: 'Error resetting table',
                    error: err
                })
                res.status(401).json({
                    status: 0,
                    message: 'Error resetting table',
                })
            });
        }).catch((err) => {
            console.error({
                status: 0,
                message: 'Error resetting table',
                error: err
            })
            res.status(401).json({
                status: 0,
                message: 'Error resetting table',
            })
        })
    }).catch((err) => {
        console.error({
            status: 0,
            message: 'Error resetting table',
            error: err
        })
        res.status(401).json({
            status: 0,
            message: 'Error resetting table',
        })
    })
}

/**
 * Shift Table 
 */
exports.shiftTable = async (req, res) => {
    try {
        let tableDetail = req.body.table_details;
        let activeTableId = tableDetail.active_table_id;
        let tableToMoveId = tableDetail.table_to_move;
    
        let activeTable = await Table.findOne({ _id : activeTableId });
        let tableToMove = await Table.findOne({ _id: tableToMoveId });
        let activeOrder = await Orders.findOne({ table_id: activeTableId });
        let activeBill = await Bill.findOne({ table_id: activeTableId });
        let activeServices = await QuickService.findOne({ table_id: activeTableId });
       
        tableToMove.set({
            table_members: activeTable.table_members,
            total_members: activeTable.total_members,
            table_amount: activeTable.table_amount,
            total_amount: activeTable.total_amount,
            members: activeTable.members,
            table_status: activeTable.table_status,
            merged_with: activeTable.merged_with,
            merged_to: activeTable.merged_to,
            parent_table: activeTable.parent_table,
            child_table: activeTable.childTable,
            has_alert: activeTable.has_alert,
            mobile_order: activeTable.mobile_order,
            session_status: activeTable.session_status,
            session_started_at: activeTable.session_started_at,
            table_order_status: activeTable.table_order_status,
            table_color: activeTable.table_color
        });
    
        let movedTable = await tableToMove.save();
    
        activeTable.set({
            table_members: 0,
            total_members: 0,
            table_amount: 0,
            total_amount: 0,
            members: [],
            merged_with: [],
            merged_to: [],
            parent_table: false,
            parent_of: [],
            child_table: false,
            child_of: [],
            has_alert: false,
            mobile_order: false,
            session_status: "inactive",
            session_started_at: null,
            table_color: null,
            table_order_status: null
        });
    
        let resettedTable = await activeTable.save();

        if(activeOrder) {
            activeOrder.set({
                table_id: tableToMoveId
            });
            await activeOrder.save();
        }

        if(activeServices){
            activeServices.set({
                table_id : tableToMoveId
            });
            await activeServices.save();
        }

        if(activeBill){
            activeBill.set({
                table_id : tableToMoveId
            });
            await activeBill.save();
        }


        // let exiting_tableData = {
        //     table_id: resettedTable._id,
        //     floor_id: resettedTable.floor_id,
        //     branch_id: resettedTable.branch_id,
        //     order_status: 'session_closed'
        // }
        let exiting_tableData = {
            table_id: movedTable._id,
            floor_id: movedTable.floor_id,
            branch_id: resettedTable.branch_id,
            order_status: 'table_shifted'
        }
        let updated_tableData = {
            table_id: movedTable._id,
            floor_id: movedTable.floor_id,
            branch_id: movedTable.branch_id
        }
        socketController.io.sockets.in(resettedTable._id).emit('update_table', exiting_tableData);
        socketController.io.sockets.in(resettedTable.branch_id).emit('update_table', exiting_tableData);

        socketController.io.sockets.in(movedTable._id).emit('update_table', updated_tableData);
        socketController.io.sockets.in(movedTable.branch_id).emit('update_table', updated_tableData);
    
        res.status(200).json({
            status: 1,
            message: 'Table moved successfully'
        })
    }catch(err){
        res.status(500).json({
            status: 0,
            message: 'Error shifting table',
        })
    }
}


/**
 * The functions written below are not using async function
 */
async function resetTable(tableDetail) {
    return new Promise((resolve, reject) => {
        Table.findOne({ '_id': tableDetail._id }, (err, tables) => {
            if (err) {
                reject({ status: 0, message: 'Error finding table' })
            } else {
                let table_detail = JSON.parse(JSON.stringify(tables));
                table_detail.table_id = tables._id;  //this will set the table id to table_id in history
                table_detail._id = undefined;    //this will reset the old _id
                table_detail.order_number = tableDetail.order_number;
                let response;

                return saveTableHistory(table_detail).then((historyTable) => {

                    let OtherTableList = tables.merged_with.map((mergedTable) => {
                        let table_id = new mongoose.mongo.ObjectId(mergedTable.table_id);
                        return table_id
                    });

                    let resetdata = {
                        "table_members": 0,
                        "total_members": 0,
                        "table_amount": 0,
                        "total_amount": 0,
                        "members": [],
                        "merged_with": [],
                        "merged_to": [],
                        "parent_table": false,
                        "parent_of": [],
                        "child_table": false,
                        "child_of": [],
                        "has_alert": false,
                        "mobile_order": false,
                        "session_status": "inactive",
                        "session_started_at": null,
                        "table_color": undefined,
                        "table_order_status": undefined,
                        "__v": 0
                    }
                    return Table.findOneAndUpdate({ "_id": tables._id }, { $set: resetdata }, (err, UpdatedParent) => {
                        if (err) {
                            reject(err);
                        } else if (OtherTableList) {
                            Table.updateMany(
                                { "_id": { "$in": OtherTableList } },
                                { $set: resetdata },
                                ((err, updatedresult) => {
                                    if (err) {
                                        reject(err);
                                    } else {
                                        // resolve(updatedresult);
                                        resolve(tables)
                                    }
                                })
                            )
                        } else {
                            // resolve(UpdatedParent);
                            resolve(tables)
                        }
                    })
                })
            }
        })
    })
}

async function resetOrder(tableId) {
    // let response;
    return new Promise((resolve, reject) => {
        Orders.findOne({ 'table_id': tableId }, (err, order) => {
            if (err) {
                reject({ status: 0, message: 'Error finding order' })
            } else if (order) {
                let order_detail = JSON.parse(JSON.stringify(order));
                return saveOrderHistory(order_detail).then((savedOrderHistory) => {
                    return Orders.findByIdAndRemove(savedOrderHistory.order_id, (err, removedOrder) => {
                        if (err) {
                            reject({ status: 0, message: 'Error removing order' })
                        } else {
                            resolve({ status: 1, message: 'Order removed successfully!', orderId: savedOrderHistory.order_id, orderNumber: savedOrderHistory.order_number })
                        }
                    })
                })
            } else {
                resolve({ status: 1, message: 'No Order found' })
            }
        })
    })
}

async function saveOrderHistory(order_detail) {
    let response;
    let history_order = new HistoryOrders(order_detail);
    history_order.order_status = 'cancelled';
    history_order.order_id = history_order._id;
    history_order._id = undefined;
    return new Promise((resolve, reject) => {
        history_order.save((err, orderHistory) => {
            if (err) {
                reject(err)
            } else {
                resolve(orderHistory)
            }
        });
    })
}

async function resetBill(orderId) {
    return new Promise((resolve, reject) => {
        Bill.findOne({ 'order_id': orderId }, (err, bills) => {
            if (err) {
                return { status: 0, message: 'Error Finding bill' }
            } else {
                let bill_detail = JSON.parse(JSON.stringify(bills));
                return saveBillHistory(bill_detail).then((savedBillHistory) => {
                    return Bill.findOneAndRemove({ 'order_id': orderId }, (err, removedBill) => {
                        if (err) {
                            reject({ status: 0, message: 'error removing bill' })
                        } else {
                            resolve({ status: 1, message: 'bill removed successfully' })
                        }
                    })
                });
            }
        })
    })
}

async function saveBillHistory(bill_detail) {
    let bill_history = new HistoryBills(bill_detail);
    return new Promise((resolve, reject) => {
        bill_history.save((err, billHistory) => {
            if (err) {
                reject({ status: 0, message: 'Error saving bill history' })
            } else {
                resolve({ status: 1, message: 'Bill saved to history' })
            }
        })
    })
}

async function saveTableHistory(table_detail) {
    let response;
    let table_history = new HistoryTables(table_detail);
    return new Promise((resolve, reject) => {
        table_history.save((err, tables) => {
            if (err) {
                reject({ status: 0, message: 'Error resetting table' })
            } else {
                resolve({ status: 1, message: 'Table added to the history' })
            }
        })
    })
}

async function resetQuickService(tableId) {
    return new Promise((resolve, reject) => {
        QuickService.findOne({ 'table_id': tableId }, (err, service) => {
            if (err) {
                return { status: 0, message: 'Error Finding bill' }
            } else {
                let service_detail = JSON.parse(JSON.stringify(service));
                return saveServiceHistory(service_detail).then((savedServiceHistory) => {
                    return QuickService.findOneAndRemove({ 'table_id': tableId }, (err, removedService) => {
                        if (err) {
                            reject({ status: 0, message: 'error removing bill' })
                        } else {
                            resolve({ status: 1, message: 'service removed successfully' })
                        }
                    })
                });
            }
        })
    })
}

async function saveServiceHistory(service_detail) {
    let response;
    let quick_services_history = new QuickServiceHistory(service_detail);
    return new Promise((resolve, reject) => {
        quick_services_history.save((err, service) => {
            if (err) {
                reject({ status: 0, message: 'Error resetting table' })
            } else {
                resolve({ status: 1, message: 'service added to the history' })
            }
        })
    })
}