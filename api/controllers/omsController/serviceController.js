'use strict';
const QuickService = require('../../models/omsModels/quick_service.model');
const QuickServiceHistory = require('../../models/history/omsModels/quick_services_history.model');
const Orders = require('../../models/omsModels/order.model');
const Table = require('../../models/omsModels/table.model');
const TableController = require('./table.controller');
const socketController = require('../../controllers/common/socket.controller.js');
const PushController = require('../../controllers/common/push.controller');
const OrderController = require('./order.controller');
const CompanyModel = require('../../models/company.model');

/**
 * Get Quick Service
 */
exports.getQuickService = (req, res) => {
    if (req.accessType === 'superadmin' || req.accessType === 'admin' || req.accessType === 'staffs') {
        let paramId = req.params.orderId;
        let query;

        if (paramId.startsWith('TA')) {
            query = { 'takeaway_id': paramId };
        } else if (paramId.startsWith('HD')) {
            query = { 'delivery_id': paramId };
        } else {
            query = { 'table_id': paramId };
        }

        if (!paramId && !req.params.status) {
            console.error({
                status: 0,
                message: 'Invalid Access Type',
                error: 'Invalid Access Type'
            });
            res.status(401).json({
                status: 0,
                message: 'Invalid Access Type',
                error: 'Invalid Access Type'
            })
        } else if (paramId && !req.params.status) {
            QuickService.findOne(query, (err, quickServiceDetails) => {
                if (err) {
                    console.error({
                        status: 0,
                        message: 'Error Getting Serice details',
                        error: err
                    });
                    res.status(500).json({
                        status: 0,
                        message: 'Error Getting Serice details',
                        error: 'Problem with the server'
                    });
                } else if (!quickServiceDetails) {
                    res.status(404).json({
                        status: 1,
                        message: 'No previous quick service found for this particular order'
                    });
                } else {
                    res.status(200).json({
                        status: 1,
                        message: 'success',
                        service: quickServiceDetails
                    })
                }
            })
        } else if (paramId && req.params.status) {
            QuickService.findOne(query, (err, quickServiceDetails) => {
                if (err) {
                    console.error({
                        status: 0,
                        message: 'Error Getting Serice details',
                        error: err
                    });
                    res.status(500).json({
                        status: 0,
                        message: 'Error Getting Serice details',
                        error: 'Problem with the server'
                    });
                } else if (!quickServiceDetails) {
                    res.status(200).json({
                        status: 0,
                        message: 'No previous quick service found for this particular order',
                    });
                } else {
                    let requiredStatus = req.params.status;
                    if (requiredStatus !== 'confirmed' && requiredStatus !== 'requested') {
                        res.status(404).json({
                            status: 0,
                            message: 'Invalid status code'
                        });
                    } else {
                        let filteredService = quickServiceDetails.services.filter((service) => {
                            if (service.service_status === requiredStatus) {
                                return service
                            }
                        });

                        if (filteredService.length > 0) {
                            quickServiceDetails.services = filteredService;

                            res.status(200).json({
                                status: 1,
                                message: 'Quick Services Obtained successfully',
                                service: quickServiceDetails
                            })
                        } else {
                            res.status(200).json({
                                status: 0,
                                message: 'No Services found with the particular status',
                                service: quickServiceDetails
                            })
                        }
                    }
                }
            })
        }
    } else if (req.accessType === 'guest') {
        let query;
        let paramId;
        if (req.tableId) {
            paramId = req.tableId;
            query = { 'table_id': paramId }
        } else if (req.orderId) {
            paramId = req.orderId;
            query = { 'takeaway_id': paramId }
        }
        QuickService.findOne(query, (err, quickServiceDetails) => {
            if (err) {
                console.error({
                    status: 0,
                    message: 'Error Getting Serice details',
                    error: err
                });
                res.status(500).json({
                    status: 0,
                    message: 'Error Getting Serice details',
                    error: 'Problem with the server'
                });
            } else if (!quickServiceDetails) {
                res.status(404).json({
                    status: 1,
                    message: 'No previous quick service found for this particular order'
                });
            } else {
                if (req.params.status) {
                    let requiredStatus = req.params.status;
                    if (requiredStatus !== 'confirmed' && requiredStatus !== 'requested') {
                        res.status(404).json({
                            status: 0,
                            message: 'Invalid status code'
                        });
                    } else {
                        let filteredService = quickServiceDetails.services.filter((service) => {
                            if (service.service_status === requiredStatus) {
                                return service
                            }
                        });

                        if (filteredService.length > 0) {
                            quickServiceDetails.services = filteredService;

                            res.status(200).json({
                                status: 1,
                                message: 'Quick Services Obtained successfully',
                                service: quickServiceDetails
                            })
                        } else {
                            res.status(200).json({
                                status: 0,
                                message: 'No Services found with the particular status',
                            })
                        }
                    }
                } else {
                    res.status(200).json({
                        status: 1,
                        message: 'success',
                        service: quickServiceDetails
                    })
                }
            }
        })
    } else {
        console.error({
            status: 0,
            message: 'Invalid Acesss',
            error: 'Invalid access type'
        });
        res.status(401).json({
            status: 0,
            message: 'Invalid Acesss 3'
        })
    }
}

/**
 * Create Quick Service
 */
exports.updateQuickService = (req, res) => {
    let quickServiceData = req.body;
    if (req.accessType === 'guest') {
        let query;
        let paramsId;
        // if (req.orderId) {
        //     paramsId = req.orderId;
        //     query = { 'takeaway_id': paramsId };
        //     quickServiceData['takeaway_id'] = paramsId;
        // } else if (req.tableId) {
        //     paramsId = req.tableId;
        //     query = { 'table_id': paramsId };
        //     quickServiceData['table_id'] = paramsId;
        // } else if (req.deliveryId) {
        //     //NOTE: not for now
        //     paramsId = req.deliveryId;
        //     query = { 'delivery_id': paramsId };
        //     quickServiceData['delivery_id'] = paramsId;
        // }
        if (quickServiceData.order_type && quickServiceData.order_type === 'take_aways') {
            paramsId = quickServiceData.type_id;
            query = { 'takeaway_id': paramsId };
            quickServiceData['takeaway_id'] = paramsId;
        } else if (quickServiceData.order_type && quickServiceData.order_type === 'in_house') {
            paramsId = quickServiceData.type_id;
            query = { 'table_id': paramsId };
            quickServiceData['table_id'] = paramsId;
        } else if (quickServiceData.order_type && quickServiceData.order_type === 'home_Delivery') {
            //NOTE: not for now
            paramsId = quickServiceData.type_id;
            query = { 'delivery_id': paramsId };
            quickServiceData['delivery_id'] = paramsId;
        } else {
            console.error({
                status: 0,
                message: 'Invalid Parameter',
                error: 'Invalid Parameter'
            });
            res.status(400).json({
                status: 0,
                message: 'Invalid Parameter',
                error: 'Invalid Parameter'
            });
            return;
        }
        QuickService.findOne(query, (err, quickServiceDetails) => {
            if (err) {
                console.error({
                    status: 0,
                    message: 'Error Getting Serice details',
                    error: err
                });
                res.status(500).json({
                    status: 0,
                    message: 'Error Getting Serice details',
                    error: 'Problem with the server'
                });
            } else if (!quickServiceDetails) {
                quickServiceData.services.forEach(service => {
                    service.service_status = 'requested';
                    service.caller_id = req.userId;
                    service.caller_name = req.userName;
                });
                quickServiceData.branch_id = req.branchId;

                let service = new QuickService(quickServiceData);

                service.save((err, result) => {
                    if (err) {
                        console.error({
                            status: 0,
                            message: 'Problem updating service with the database',
                            error: err
                        });
                        res.status(500).json({
                            status: 0,
                            message: 'Problem updating service with the database',
                            error: 'Problem with the server'
                        })
                    } else {
                        if (req.accessType === 'guest' && req.tableId) {
                            //TODO: check if the savedservice result.services is with rquested status as well as !free_service
                            // if any thing satisfies the condition
                            // then consider it as an order, so make the service as item create a new order for the table with status placed/requested
                            // else..
                            // consider it as service and make an order with empty order_list
                            Table.findOne({ _id: req.tableId }, (err, table) => {
                                if (err) {
                                    console.error({
                                        status: 0,
                                        message: 'error adding service',
                                        error: err
                                    });
                                    res.status(500).json({
                                        status: 0,
                                        message: 'error adding service',
                                        error: 'problem with the server'
                                    })
                                } else {
                                    let moded_query;
                                    if (table.session_status === 'inactive') {
                                        TableController.getNextColor(req.branchId, (color) => {
                                            let members = table.members;
                                            members.push(req.userId);
                                            moded_query = {
                                                $set: {
                                                    has_alert: true,
                                                    session_status: 'active',
                                                    table_members: table.table_members + 1,
                                                    total_members: table.total_members + 1,
                                                    members: members,
                                                    parent_table: true,
                                                    mobile_order: true,
                                                    table_color: color
                                                }
                                            }

                                            activateTable();
                                        })

                                    } else {
                                        moded_query = { $set: { has_alert: true } };
                                        activateTable();
                                    }

                                    function activateTable() {
                                        Table.findOneAndUpdate({ _id: req.tableId }, moded_query, { new: true }, (err, updatedResult) => {
                                            if (err) {
                                                console.error({
                                                    status: 0,
                                                    message: "Error Updating Order",
                                                    error: err
                                                })
                                                res.status(500).json({
                                                    status: 0,
                                                    message: "Error Updating Order",
                                                    error: 'Problem with the server'
                                                });
                                            } else {
                                                let payableServices = [];
                                                quickServiceData.services.forEach(service => {
                                                    if (!service.free_service && service.service_status === 'requested') {
                                                        payableServices.push(service);
                                                    }
                                                });
                                                if (!payableServices.length) {
                                                    Orders.findOne({ table_id: req.tableId }, async (err, existingOrder) => {
                                                        if (err) {
                                                            console.error({
                                                                status: 0,
                                                                message: 'error finding order',
                                                                error: err
                                                            });
                                                            res.status(500).json({
                                                                status: 0,
                                                                message: 'error finding order',
                                                                error: 'problem with the server'
                                                            });
                                                        } else if (!existingOrder) {
                                                            let orderDetails = {};
                                                            orderDetails.order_type = 'in_house';

                                                            let f_order = new Orders(orderDetails);
                                                            // f_order.order_number = await OrderController.updateCount(req.branchId, 'order', orderDetails.order_type);
                                                           
                                                            let order_count = await OrderController.updateCount(req.branchId, 'order', orderDetails.order_type)

                                                            f_order.order_number = order_count.new_order_count;
				                                            f_order.order_type_number = order_count.new_order_type_count;


                                                            f_order.branch_id = req.branchId;
                                                            f_order.table_id = req.tableId ? req.tableId : null;
                                                            f_order.order_id = req.orderId ? req.orderId : null;  // use quickServiceData.type_id instead
                                                            f_order.delivery_id = req.deliveryId ? req.deliveryId : null;
                                                            f_order.total_cost = 0;
                                                            f_order.final_cost = 0;
                                                            f_order.order_status = 'placed';
                                                            f_order.has_alert = true;

                                                            f_order.save((err, savedOrder) => {
                                                                if (err) {
                                                                    console.error({
                                                                        status: 0,
                                                                        message: 'Error saving Order',
                                                                        error: err
                                                                    });
                                                                    res.status(500).json({
                                                                        status: 0,
                                                                        message: 'Error Saving Order',
                                                                        error: 'Problem with the server'
                                                                    })
                                                                } else {
                                                                    res.status(200).json({
                                                                        status: 1,
                                                                        message: 'Service Added successfully',
                                                                    });

                                                                    let tableData = {
                                                                        table_id: updatedResult._id,
                                                                        floor_id: updatedResult.floor_id,
                                                                        branch_id: req.branchId,
                                                                        message: 'service successfully placed',
                                                                        socket_data: 'service_placed'
                                                                    }

                                                                    let orderData = {
                                                                        _id: savedOrder._id,
                                                                        table_id: savedOrder.table_id,
                                                                        order_status: 'placed'
                                                                    }

                                                                    socketController.io.sockets.in(req.branchId).emit('update_order', orderData);
                                                                    socketController.io.sockets.in(req.branchId).emit('update_service', orderData);
                                                                    socketController.io.sockets.in(req.branchId).emit('update_table', tableData);

                                                                    // PushController.notifyBranchMembers(req.branchId, { message: 'Quick Service Call' }).then((result) => {
                                                                    //     console.info('Table order updated by guest');
                                                                    //     // PushController.notifyTableMembers(req.tableId, { message: 'Order Updated Successfully' }).then((result) => {
                                                                    //     // })
                                                                    // })
                                                                    PushController.notifyZoneMembers(req.branchId, updatedResult.floor_id,  updatedResult._id, { message: 'Quick Service Call' }).then((result) => {
                                                                        console.info('Table order updated by guest');
                                                                        // PushController.notifyTableMembers(req.tableId, { message: 'Order Updated Successfully' }).then((result) => {
                                                                        // })
                                                                    })
                                                                }
                                                            })
                                                        } else {
                                                            existingOrder.order_status = 'placed';
                                                            existingOrder.has_alert = true;
                                                            existingOrder.save((err, savedOrder) => {
                                                                if (err) {
                                                                    console.error({
                                                                        status: 0,
                                                                        message: 'Error confirming service',
                                                                        error: err
                                                                    })
                                                                    res.status(500).json({
                                                                        status: 0,
                                                                        message: 'Error confirming service',
                                                                        error: 'Problem with the server'
                                                                    })
                                                                } else {
                                                                    res.status(200).json({
                                                                        status: 1,
                                                                        message: 'Service added successfully'
                                                                    });
                                                                    let orderData = {
                                                                        _id: savedOrder._id,
                                                                        table_id: savedOrder.table_id,
                                                                        order_status: 'placed'
                                                                    }
                                                                    let tableData = {
                                                                        table_id: updatedResult._id,
                                                                        floor_id: updatedResult.floor_id,
                                                                        branch_id: req.branchId,
                                                                        message: 'service placed successfully',
                                                                        socket_data: 'service_placed'
                                                                    }

                                                                    socketController.io.sockets.in(req.branchId).emit('update_order', orderData);
                                                                    socketController.io.sockets.in(req.branchId).emit('update_service', orderData);
                                                                    socketController.io.sockets.in(req.branchId).emit('update_table', tableData);
                                                                    // PushController.notifyBranchMembers(req.branchId, { message: 'Quick Service Call' }).then((result) => {
                                                                    //     console.info('Table order updated by guest');
                                                                    // })
                                                                    PushController.notifyZoneMembers(req.branchId, updatedResult.floor_id, updatedResult._id, { message: 'Quick Service Call' }).then((result) => {
                                                                        console.info('Table order updated by guest');
                                                                    })
                                                                }
                                                            })

                                                        }
                                                    })
                                                } else {
                                                    Orders.findOne({ table_id: req.tableId }, async (err, order) => {
                                                        if (err) {
                                                            console.error({
                                                                status: 0,
                                                                message: 'error occured while finding orders',
                                                                error: err
                                                            });
                                                            res.status(500).json({
                                                                status: 0,
                                                                message: 'error occured while finding orders',
                                                                error: 'problem with the server'
                                                            })
                                                        } else if (!order) {
                                                            let orderDetails = new Orders();

                                                            if (quickServiceData.table_id) {
                                                                orderDetails['table_id'] = quickServiceData.table_id;
                                                                orderDetails['order_id'] = null;
                                                                orderDetails['delivery_id'] = null;
                                                                orderDetails['order_type'] = 'in_house';
                                                            } else if (quickServiceData.takeaway_id) {
                                                                orderDetails['table_id'] = null;
                                                                orderDetails['order_id'] = quickServiceData.takeaway_id;
                                                                orderDetails['delivery_id'] = null;
                                                                orderDetails['order_type'] = 'take_aways';
                                                                orderDetails['delivery_address'] = {
                                                                    customer_id: req.userId,
                                                                    person_name: req.userName
                                                                }
                                                            } else if (quickServiceData.delivery_id) {
                                                                //NOTE: Condition Not Exists
                                                                orderDetails['table_id'] = null;
                                                                orderDetails['order_id'] = null;
                                                                orderDetails['delivery_id'] = quickServiceData.delivery_id;
                                                                orderDetails['order_type'] = 'home_delivery';
                                                            }

                                                            let firstOrderList = {
                                                                order_status: 'placed',
                                                                order_type: 'in_house',
                                                                item_details: []
                                                            }
                                                            orderDetails.order_list.push(firstOrderList);

                                                            let payableServiceCost = 0;

                                                            payableServices.forEach((service) => {
                                                                let serviceAsItem = {}
                                                                serviceAsItem['name'] = service.name;
                                                                serviceAsItem['selling_price'] = service.price;
                                                                serviceAsItem['sold_price'] = service.price;
                                                                // serviceAsItem['quantity'] = service.quantity;
                                                                // serviceAsItem['count'] = service.quantity;
                                                                serviceAsItem['quantity'] = 1;
                                                                serviceAsItem['count'] = 1;
                                                                serviceAsItem['food_type'] = 'Veg';
                                                                serviceAsItem['kot_number'] = orderDetails.order_list.length;
                                                                serviceAsItem['customer_id'] = service['caller_id'];
                                                                serviceAsItem['customer_name'] = service['caller_name']

                                                                if (quickServiceData.takeaway_id) {
                                                                    serviceAsItem['customer_id'] = service['caller_id'];
                                                                    serviceAsItem['customer_name'] = service['caller_name']
                                                                }

                                                                firstOrderList.item_details.push(serviceAsItem);
                                                                payableServiceCost += service.price * (service.quantity ? service.quantity : 1)
                                                            });

                                                            // orderDetails.order_number = await OrderController.updateCount(req.branchId, 'order', orderDetails['order_type']);
                                                            let order_count = await OrderController.updateCount(req.branchId, 'order', orderDetails['order_type'])

                                                            orderDetails.order_number = order_count.new_order_count;
				                                            orderDetails.order_type_number = order_count.new_order_type_count;


                                                            orderDetails.branch_id = req.branchId;
                                                            orderDetails.total_cost = 0;
                                                            orderDetails.final_cost = 0;
                                                            // orderDetails.total_cost = payableServiceCost;
                                                            // orderDetails.final_cost = payableServiceCost;

                                                            orderDetails.order_list[0] = firstOrderList;
                                                            orderDetails.has_alert = true;

                                                            let companyDetail = await CompanyModel.findOne({ _id: table.company_id });

                                                            let serviceChargePercentage = companyDetail.service_charge ? companyDetail.service_charge : 0;

                                                            let hasServiceCharge = serviceChargePercentage > 0 ? true : false;

                                                            orderDetails.service_charge_percentage = serviceChargePercentage;
                                                            orderDetails.is_applied_service_charge = hasServiceCharge;
                                                            
                                                            orderDetails.save((err, savedOrder) => {
                                                                if (err) {
                                                                    console.error({
                                                                        status: 0,
                                                                        message: 'Error confirming Service',
                                                                        error: err
                                                                    });
                                                                    res.status(500).json({
                                                                        status: 0,
                                                                        message: 'Error confirming Service',
                                                                        error: 'Problem with the server'
                                                                    });
                                                                } else {
                                                                    let orderData = {
                                                                        _id: savedOrder._id,
                                                                        table_id: savedOrder.table_id,
                                                                        order_status: 'placed'
                                                                    }
                                                                    let tableData = {
                                                                        table_id: updatedResult._id,
                                                                        floor_id: updatedResult.floor_id,
                                                                        branch_id: req.branchId,
                                                                        message: 'service placed successfully',
                                                                        socket_data: 'service_placed'
                                                                    }

                                                                    socketController.io.sockets.in(req.branchId).emit('update_order', orderData);
                                                                    socketController.io.sockets.in(req.branchId).emit('update_table', tableData);
                                                                    socketController.io.sockets.in(req.branchId).emit('update_service', orderData);

                                                                    res.status(201).json({
                                                                        status: 1,
                                                                        message: "Service added successfully",
                                                                    });
                                                                    // PushController.notifyBranchMembers(req.branchId, { message: 'Service Placed Successfully' }).then((result) => {
                                                                    //     console.info('Table order updated by guest');
                                                                    // });

                                                                    PushController.notifyZoneMembers(req.branchId, updatedResult.floor_id, updatedResult._id, { message: 'Service Placed Successfully' }).then((result) => {
                                                                        console.info('Table order updated by guest');
                                                                    });
                                                                }
                                                            })
                                                        } else {
                                                            Orders.findOneAndUpdate({ 'table_id': req.tableId }, { $set: { has_alert: true } }, { new: true }, (err, orderDetails) => {
                                                                if (err) {
                                                                    console.error({
                                                                        status: 0,
                                                                        message: 'Error finding Order',
                                                                        error: err
                                                                    });
                                                                    res.status(500).json({
                                                                        status: 0,
                                                                        message: 'Error finding Order',
                                                                        error: 'Problem with the server'
                                                                    })
                                                                } else if (orderDetails) {
                                                                    let lastorder = orderDetails.order_list[orderDetails.order_list.length - 1];

                                                                    let payableServiceCost = 0;

                                                                    payableServices.forEach((service) => {
                                                                        let serviceAsItem = {}
                                                                        serviceAsItem['name'] = service.name;
                                                                        serviceAsItem['selling_price'] = service.price;
                                                                        serviceAsItem['sold_price'] = service.price;
                                                                        // serviceAsItem['quantity'] = service.quantity;
                                                                        // serviceAsItem['count'] = service.quantity;
                                                                        serviceAsItem['quantity'] = 1;
                                                                        serviceAsItem['count'] = 1;
                                                                        serviceAsItem['food_type'] = 'Veg';
                                                                        serviceAsItem['kot_number'] = orderDetails.order_list.length;
                                                                        serviceAsItem['customer_id'] = service['caller_id'];
                                                                        serviceAsItem['customer_name'] = service['caller_name'];

                                                                        lastorder.item_details.push(serviceAsItem);
                                                                        payableServiceCost += service.price * (service.quantity ? service.quantity : 1)
                                                                    });

                                                                    orderDetails.order_status = 'placed'
                                                                    // orderDetails.total_cost = orderDetails.total_cost + payableServiceCost;
                                                                    // orderDetails.final_cost = orderDetails.final_cost + payableServiceCost;
                                                                    orderDetails.total_cost = orderDetails.total_cost;
                                                                    orderDetails.final_cost = orderDetails.final_cost;
                                                                    orderDetails.order_list[orderDetails.order_list.length - 1] = lastorder;

                                                                    orderDetails.save((err, savedOrder) => {
                                                                        if (err) {
                                                                            console.error({
                                                                                status: 0,
                                                                                message: 'Error confirming Service',
                                                                                error: err
                                                                            });
                                                                            res.status(500).json({
                                                                                status: 0,
                                                                                message: 'Error confirming Service',
                                                                                error: 'Problem with the server'
                                                                            });
                                                                        } else {
                                                                            res.status(201).json({
                                                                                status: 1,
                                                                                message: 'Service confirmed successfully',
                                                                            });

                                                                            let orderData = {
                                                                                _id: savedOrder._id,
                                                                                table_id: savedOrder.table_id,
                                                                                order_status: 'placed'
                                                                            }
                                                                            let tableData = {
                                                                                table_id: updatedResult._id,
                                                                                floor_id: updatedResult.floor_id,
                                                                                branch_id: req.branchId,
                                                                                message: 'service placed successfully',
                                                                                socket_data: 'service_placed'
                                                                            }

                                                                            // socketController.io.sockets.in(req.branchId).emit('update_table', orderData);
                                                                            // socketController.io.sockets.in(req.branchId).emit('update_takeaway_list', orderData);
                                                                            // socketController.io.sockets.in(req.orderId).emit('update_order', orderData);
                                                                            socketController.io.sockets.in(req.branchId).emit('update_order', orderData);
                                                                            socketController.io.sockets.in(req.branchId).emit('update_service', orderData);
                                                                            socketController.io.sockets.in(req.branchId).emit('update_table', tableData);
                                                                            // PushController.notifyBranchMembers(req.branchId, { message: 'Service Placed Successfully' }).then((result) => {
                                                                            //     console.info('Table order updated by guest');
                                                                            // })
                                                                            PushController.notifyZoneMembers(req.branchId, updatedResult.floor_id, updatedResult._id, { message: 'Service Placed Successfully' }).then((result) => {
                                                                                console.info('Table order updated by guest');
                                                                            })
                                                                        }
                                                                    })
                                                                } else {
                                                                    res.status(404).json({
                                                                        status: 0,
                                                                        message: 'No service Found',
                                                                    })
                                                                }
                                                            })
                                                        }
                                                    })
                                                }
                                            }
                                        })
                                    }
                                }
                            })
                        } else if (req.accessType === 'guest' && req.orderId) {
                            let queryOrderId = quickServiceData.type_id;

                            let payableServices = [];
                            quickServiceData.services.forEach(service => {
                                if (!service.free_service && service.service_status === 'requested') {
                                    payableServices.push(service);
                                }
                            });

                            if (!payableServices.length) {
                                Orders.findOne({ order_id: queryOrderId }, async (err, existingOrder) => {
                                    if (err) {
                                        console.error({
                                            status: 0,
                                            message: 'error finding order',
                                            error: err
                                        });
                                        res.status(500).json({
                                            status: 0,
                                            message: 'error finding order',
                                            error: 'problem with the server'
                                        });
                                    } else if (!existingOrder) {
                                        let orderDetails = {};
                                        if (req.orderId) {
                                            orderDetails['delivery_id'] = null;
                                            orderDetails['order_type'] = 'take_aways';
                                            orderDetails['delivery_address'] = {
                                                customer_id: req.userId,
                                                person_name: req.userName
                                            }
                                        } else if (req.tableId) {
                                            orderDetails.order_type = 'in_house';
                                        }

                                        let f_order = new Orders(orderDetails);

                                        // f_order.order_number = await OrderController.updateCount(req.branchId, 'order', orderDetails.order_type);         
                                        let order_count = await OrderController.updateCount(req.branchId, 'order', orderDetails.order_type)

                                        f_order.order_number = order_count.new_order_count;
                                        f_order.order_type_number = order_count.new_order_type_count;

                                        
                                        
                                        f_order.branch_id = req.branchId;
                                        f_order.table_id = req.tableId ? req.tableId : null;
                                        f_order.order_id = req.orderId ? queryOrderId : null;
                                        f_order.delivery_id = req.deliveryId ? req.deliveryId : null;
                                        f_order.total_cost = 0;
                                        f_order.final_cost = 0;
                                        f_order.order_status = 'placed';
                                        f_order.has_alert = true;

                                        f_order.save((err, savedOrder) => {
                                            if (err) {
                                                console.error({
                                                    status: 0,
                                                    message: 'Error saving Order',
                                                    error: err
                                                });
                                                res.status(500).json({
                                                    status: 0,
                                                    message: 'Error Saving Order',
                                                    error: 'Problem with the server'
                                                })
                                            } else {
                                                res.status(200).json({
                                                    status: 1,
                                                    message: 'Service Added successfully',
                                                });

                                                let orderData = {
                                                    _id: savedOrder._id,
                                                    order_id: savedOrder.order_id,
                                                    order_status: 'placed'
                                                }

                                                // socketController.io.sockets.in(req.branchId).emit('update_table', orderData);
                                                // socketController.io.sockets.in(req.branchId).emit('update_order', orderData);
                                                // socketController.io.sockets.in(req.orderId).emit('update_order', orderData);
                                                socketController.io.sockets.in(req.branchId).emit('update_service', orderData);
                                                socketController.io.sockets.in(req.branchId).emit('update_takeaway', orderData);

                                                PushController.notifyBranchMembers(req.branchId, { message: 'Quick Service Call' }).then((result) => {
                                                    console.info('Table order updated by guest');
                                                    // PushController.notifyTableMembers(req.tableId, { message: 'Order Updated Successfully' }).then((result) => {
                                                    // })
                                                })
                                            }
                                        })
                                    } else {
                                        existingOrder.order_status = 'placed';
                                        existingOrder.has_alert = true;
                                        existingOrder.save((err, savedOrder) => {
                                            if (err) {
                                                console.error({
                                                    status: 0,
                                                    message: 'Error confirming service',
                                                    error: err
                                                })
                                                res.status(500).json({
                                                    status: 0,
                                                    message: 'Error confirming service',
                                                    error: 'Problem with the server'
                                                })
                                            } else {
                                                res.status(200).json({
                                                    status: 1,
                                                    message: 'Service added successfully'
                                                });
                                                let orderData = {
                                                    _id: savedOrder._id,
                                                    order_id: savedOrder.order_id,
                                                    order_status: 'placed'
                                                }

                                                // socketController.io.sockets.in(req.branchId).emit('update_table', orderData);
                                                // socketController.io.sockets.in(req.branchId).emit('update_order', orderData);
                                                // socketController.io.sockets.in(req.orderId).emit('update_order', orderData);
                                                socketController.io.sockets.in(req.branchId).emit('update_service', orderData);
                                                PushController.notifyBranchMembers(req.branchId, { message: 'Quick Service Call' }).then((result) => {
                                                    console.info('Table order updated by guest');
                                                })
                                            }
                                        })

                                    }
                                })
                            } else {
                                Orders.findOne({ order_id: queryOrderId }, async (err, order) => {
                                    if (err) {
                                        console.error({
                                            status: 0,
                                            message: 'error occured while finding orders',
                                            error: err
                                        });
                                        res.status(500).json({
                                            status: 0,
                                            message: 'error occured while finding orders',
                                            error: 'problem with the server'
                                        })
                                    } else if (!order) {
                                        let orderDetails = new Orders();

                                        if (quickServiceData.table_id) {
                                            orderDetails['table_id'] = quickServiceData.table_id;
                                            orderDetails['order_id'] = null;
                                            orderDetails['delivery_id'] = null;
                                            orderDetails['order_type'] = 'in_house';
                                        } else if (quickServiceData.takeaway_id) {
                                            orderDetails['table_id'] = null;
                                            orderDetails['order_id'] = quickServiceData.takeaway_id;
                                            orderDetails['delivery_id'] = null;
                                            orderDetails['order_type'] = 'take_aways';
                                            orderDetails['delivery_address'] = {
                                                customer_id: req.userId,
                                                person_name: req.userName
                                            }
                                        } else if (quickServiceData.delivery_id) {
                                            //NOTE: Condition Not Exists
                                            orderDetails['table_id'] = null;
                                            orderDetails['order_id'] = null;
                                            orderDetails['delivery_id'] = quickServiceData.delivery_id;
                                            orderDetails['order_type'] = 'home_delivery';
                                        }

                                        let firstOrderList = {
                                            order_status: 'placed',
                                            order_type: 'take_aways',
                                            item_details: []
                                        }
                                        orderDetails.order_list.push(firstOrderList);

                                        let payableServiceCost = 0;

                                        payableServices.forEach((service) => {
                                            let serviceAsItem = {}
                                            serviceAsItem['name'] = service.name;
                                            serviceAsItem['selling_price'] = service.price;
                                            serviceAsItem['sold_price'] = service.price;
                                            // serviceAsItem['quantity'] = service.quantity;
                                            // serviceAsItem['count'] = service.quantity;
                                            serviceAsItem['quantity'] = 1;
                                            serviceAsItem['count'] = 1;
                                            serviceAsItem['food_type'] = 'Veg';
                                            serviceAsItem['kot_number'] = orderDetails.order_list.length;

                                            if (quickServiceData.takeaway_id) {
                                                serviceAsItem['customer_id'] = service['caller_id'];
                                                serviceAsItem['customer_name'] = service['caller_name']
                                            }

                                            firstOrderList.item_details.push(serviceAsItem);
                                            payableServiceCost += service.price * (service.quantity ? service.quantity : 1)
                                        });

                                        // orderDetails.order_number = await OrderController.updateCount(req.branchId, 'order', orderDetails.order_type);
                                        let order_count = await OrderController.updateCount(req.branchId, 'order', orderDetails.order_type)

                                        orderDetails.order_number = order_count.new_order_count;
                                        orderDetails.order_type_number = order_count.new_order_type_count;

                                       
                                        orderDetails.branch_id = req.branchId;
                                        orderDetails.total_cost = 0;
                                        orderDetails.final_cost = 0;
                                        // orderDetails.total_cost = payableServiceCost;
                                        // orderDetails.final_cost = payableServiceCost;
                                        orderDetails.order_list[0] = firstOrderList;
                                        orderDetails.has_alert = true;

                                        orderDetails.save((err, savedOrder) => {
                                            if (err) {
                                                console.error({
                                                    status: 0,
                                                    message: 'Error confirming Service',
                                                    error: err
                                                });
                                                res.status(500).json({
                                                    status: 0,
                                                    message: 'Error confirming Service',
                                                    error: 'Problem with the server'
                                                });
                                            } else {
                                                let orderData = {
                                                    _id: savedOrder._id,
                                                    order_id: savedOrder.order_id,
                                                    order_status: 'placed'
                                                }

                                                socketController.io.sockets.in(req.branchId).emit('update_takeaway', orderData);
                                                socketController.io.sockets.in(req.branchId).emit('update_service', orderData);

                                                res.status(201).json({
                                                    status: 1,
                                                    message: "Service added successfully",
                                                });

                                                PushController.notifyBranchMembers(req.branchId, { message: 'Service Placed Successfully' }).then((result) => {
                                                    console.info('Table order updated by guet -----', result);
                                                });
                                            }
                                        })
                                    } else {
                                        Orders.findOneAndUpdate({ 'order_id': queryOrderId }, { has_alert: true }, async (err, orderDetails) => {
                                            if (err) {
                                                console.error({
                                                    status: 0,
                                                    message: 'Error finding Order',
                                                    error: err
                                                });
                                                res.status(500).json({
                                                    status: 0,
                                                    message: 'Error finding Order',
                                                    error: 'Problem with the server'
                                                })
                                            } else if (!orderDetails) {
                                                let orderDetails = new Orders();

                                                if (quickServiceData.table_id) {
                                                    orderDetails['table_id'] = quickServiceData.table_id;
                                                    orderDetails['order_id'] = null;
                                                    orderDetails['delivery_id'] = null;
                                                    orderDetails['order_type'] = 'in_house';
                                                } else if (quickServiceData.takeaway_id) {
                                                    orderDetails['table_id'] = null;
                                                    orderDetails['order_id'] = quickServiceData.takeaway_id;
                                                    orderDetails['delivery_id'] = null;
                                                    orderDetails['order_type'] = 'take_aways';
                                                    orderDetails['delivery_address'] = {
                                                        customer_id: req.userId,
                                                        person_name: req.userName
                                                    }
                                                } else if (quickServiceData.delivery_id) {
                                                    orderDetails['table_id'] = null;
                                                    orderDetails['order_id'] = null;
                                                    orderDetails['delivery_id'] = quickServiceData.delivery_id;
                                                    orderDetails['order_type'] = 'home_delivery';
                                                }

                                                let firstOrderList = {
                                                    order_status: 'placed',
                                                    order_type: 'take_aways',
                                                    item_details: []
                                                }
                                                orderDetails.order_list.push(firstOrderList);

                                                let payableServiceCost = 0;

                                                payableServices.forEach((service) => {
                                                    let serviceAsItem = {}
                                                    serviceAsItem['name'] = service.name;
                                                    serviceAsItem['selling_price'] = service.price;
                                                    serviceAsItem['sold_price'] = service.price;
                                                    // serviceAsItem['quantity'] = service.quantity;
                                                    // serviceAsItem['count'] = service.quantity;
                                                    serviceAsItem['quantity'] = 1;
                                                    serviceAsItem['count'] = 1;
                                                    serviceAsItem['food_type'] = 'Veg';
                                                    serviceAsItem['kot_number'] = orderDetails.order_list.length;

                                                    if (quickServiceData.takeaway_id) {
                                                        serviceAsItem['customer_id'] = service['caller_id'];
                                                        serviceAsItem['customer_name'] = service['caller_name']
                                                    }

                                                    firstOrderList.item_details.push(serviceAsItem);
                                                    payableServiceCost += service.price * (service.quantity ? service.quantity : 1)
                                                });

                                                // orderDetails.total_cost = payableServiceCost;
                                                // orderDetails.final_cost = payableServiceCost;
                                                // orderDetails.order_number = await OrderController.updateCount(req.branchId, 'order', orderDetails.order_type);
                                                let order_count = await OrderController.updateCount(req.branchId, 'order', orderDetails.order_type)

                                                orderDetails.order_number = order_count.new_order_count;
                                                orderDetails.order_type_number = order_count.new_order_type_count;
            

                                                orderDetails.order_list[0] = firstOrderList;

                                                orderDetails.save((err, savedOrder) => {
                                                    if (err) {
                                                        console.error({
                                                            status: 0,
                                                            message: 'Error confirming Service',
                                                            error: err
                                                        });
                                                        res.status(500).json({
                                                            status: 0,
                                                            message: 'Error confirming Service',
                                                            error: 'Problem with the server'
                                                        });
                                                    } else {
                                                        res.status(201).json({
                                                            status: 1,
                                                            message: 'Service confirmed successfully',
                                                        });

                                                        let orderData = {
                                                            _id: savedOrder._id,
                                                            order_id: savedOrder.order_id,
                                                            order_status: 'placed'
                                                        }

                                                        // socketController.io.sockets.in(req.branchId).emit('update_table', orderData);
                                                        // socketController.io.sockets.in(req.branchId).emit('update_takeaway_list', orderData);
                                                        // socketController.io.sockets.in(req.orderId).emit('update_order', orderData);
                                                        socketController.io.sockets.in(req.branchId).emit('update_service', orderData);
                                                        PushController.notifyBranchMembers(req.branchId, { message: 'Service Placed Successfully' }).then((result) => {
                                                            console.info('Table order updated by guest');
                                                        })
                                                    }
                                                })

                                            } else if (orderDetails) {
                                                let lastorder = orderDetails.order_list[orderDetails.order_list.length - 1];

                                                let payableServiceCost = 0;

                                                payableServices.forEach((service) => {
                                                    let serviceAsItem = {}
                                                    serviceAsItem['name'] = service.name;
                                                    serviceAsItem['selling_price'] = service.price;
                                                    serviceAsItem['sold_price'] = service.price;
                                                    // serviceAsItem['quantity'] = service.quantity;
                                                    // serviceAsItem['count'] = service.quantity;
                                                    serviceAsItem['quantity'] = 1;
                                                    serviceAsItem['count'] = 1;
                                                    serviceAsItem['food_type'] = 'Veg';
                                                    serviceAsItem['kot_number'] = orderDetails.order_list.length;
                                                    serviceAsItem['customer_id'] = service['caller_id'];
                                                    serviceAsItem['customer_name'] = service['caller_name']

                                                    lastorder.item_details.push(serviceAsItem);
                                                    payableServiceCost += service.price * (service.quantity ? service.quantity : 1)
                                                });

                                                orderDetails.order_status = 'placed'
                                                // orderDetails.total_cost = orderDetails.total_cost + payableServiceCost;
                                                // orderDetails.final_cost = orderDetails.final_cost + payableServiceCost;
                                                orderDetails.total_cost = orderDetails.total_cost;
                                                orderDetails.final_cost = orderDetails.final_cost;
                                                orderDetails.order_list[orderDetails.order_list.length - 1] = lastorder;

                                                orderDetails.save((err, savedOrder) => {
                                                    if (err) {
                                                        console.error({
                                                            status: 0,
                                                            message: 'Error confirming Service',
                                                            error: err
                                                        });
                                                        res.status(500).json({
                                                            status: 0,
                                                            message: 'Error confirming Service',
                                                            error: 'Problem with the server'
                                                        });
                                                    } else {
                                                        res.status(201).json({
                                                            status: 1,
                                                            message: 'Service confirmed successfully',
                                                        });

                                                        let orderData = {
                                                            _id: savedOrder._id,
                                                            order_id: savedOrder.order_id,
                                                            order_status: 'placed'
                                                        }

                                                        // socketController.io.sockets.in(req.branchId).emit('update_table', orderData);
                                                        // socketController.io.sockets.in(req.branchId).emit('update_takeaway_list', orderData);
                                                        // socketController.io.sockets.in(req.orderId).emit('update_order', orderData);
                                                        socketController.io.sockets.in(req.branchId).emit('update_service', orderData);
                                                        PushController.notifyBranchMembers(req.branchId, { message: 'Service Placed Successfully' }).then((result) => {
                                                            console.info('Table order updated by guest');
                                                        })
                                                    }
                                                })
                                            } else {
                                                res.status(404).json({
                                                    status: 0,
                                                    message: 'No service Found',
                                                })
                                            }
                                        })
                                    }
                                })
                            }
                        } else {
                            res.status(404).json({
                                status: 0,
                                message: 'improper access type'
                            });
                        }
                    }
                })
            } else {
                let payableServices = [];

                quickServiceData.services.forEach(service => {
                    service.service_status = 'requested';
                    service.caller_id = req.userId;
                    service.caller_name = req.userName;
                    if (!service.free_service) {
                        payableServices.push(service);
                    }
                });

                let serviceData = quickServiceData.services[0]

                let option = { $push: { 'services': quickServiceData.services } }

                quickServiceDetails.services.forEach((service) => {
                    if (service.service_status === 'requested' && service.caller_id === serviceData.caller_id && service.name === serviceData.name) {
                        quickServiceData.services[0].quantity = service.quantity++;
                        query['services._id'] = service._id;
                        option = {
                            $set: { "services.$.quantity": service.quantity++ }
                        }
                    }
                })

                QuickService.findOneAndUpdate(
                    // { "order_id": quickServiceData.order_id }, 
                    query,
                    option,
                    { new: true },
                    (err, updatedOrder) => {
                        if (err) {
                            console.error({
                                status: 0,
                                message: 'Error updating service call',
                                error: err
                            });
                            res.status(500).json({
                                status: 0,
                                message: 'Error updating service call',
                                error: 'Problem with the server'
                            });
                        } else {
                            if (payableServices.length) {
                                if (req.orderId) {
                                    Orders.findOneAndUpdate({ 'order_id': quickServiceData.type_id }, { has_alert: true }, (err, orderDetails) => {
                                        if (err) {
                                            console.error({
                                                status: 0,
                                                message: 'Error finding Order',
                                                error: err
                                            });
                                            res.status(500).json({
                                                status: 0,
                                                message: 'Error finding Order',
                                                error: 'Problem with the server'
                                            })
                                        } else if (!orderDetails) {
                                            //TODO: Sait as new order and put it in new KOT
                                            let orderDetails = new Orders();

                                            if (quickServiceData.table_id) {
                                                orderDetails['table_id'] = quickServiceData.table_id;
                                                orderDetails['order_id'] = null;
                                                orderDetails['delivery_id'] = null;
                                                orderDetails['order_type'] = 'in_house';
                                            } else if (quickServiceData.takeaway_id) {
                                                orderDetails['table_id'] = null;
                                                orderDetails['order_id'] = quickServiceData.takeaway_id;
                                                orderDetails['delivery_id'] = null;
                                                orderDetails['order_type'] = 'take_aways';
                                                orderDetails['delivery_address'] = {
                                                    customer_id: updatedOrder.services ? updatedOrder.services[0].caller_id : req.userId,
                                                    person_name: updatedOrder.services ? updatedOrder.services[0].caller_name : req.userName
                                                }
                                            } else if (quickServiceData.delivery_id) {
                                                //NOTE: Condition Not Exists
                                                orderDetails['table_id'] = null;
                                                orderDetails['order_id'] = null;
                                                orderDetails['delivery_id'] = quickServiceData.delivery_id;
                                                orderDetails['order_type'] = 'home_delivery';
                                            }

                                            let firstOrderList = {
                                                order_status: 'placed',
                                                order_type: 'take_aways',
                                                item_details: []
                                            }
                                            orderDetails.order_list.push(firstOrderList);

                                            let payableServiceCost = 0;

                                            payableServices.forEach((service) => {
                                                let serviceAsItem = {}
                                                serviceAsItem['name'] = service.name;
                                                serviceAsItem['selling_price'] = service.price;
                                                serviceAsItem['sold_price'] = service.price;
                                                // serviceAsItem['quantity'] = service.quantity;
                                                // serviceAsItem['count'] = service.quantity;
                                                serviceAsItem['quantity'] = 1;
                                                serviceAsItem['count'] = 1;
                                                serviceAsItem['food_type'] = 'Veg';
                                                serviceAsItem['kot_number'] = orderDetails.order_list.length;

                                                if (quickServiceData.table_id) {
                                                    serviceAsItem['customer_id'] = service['caller_id'];
                                                    serviceAsItem['customer_name'] = service['caller_name']
                                                }

                                                firstOrderList.item_details.push(serviceAsItem);
                                                payableServiceCost += service.price * (service.quantity ? service.quantity : 1)
                                            });

                                            orderDetails.total_cost = 0;
                                            orderDetails.final_cost = 0;
                                            // orderDetails.total_cost = payableServiceCost;
                                            // orderDetails.final_cost = payableServiceCost;
                                            orderDetails.order_list[0] = firstOrderList;
                                            orderDetails.has_alert = true;

                                            orderDetails.save((err, savedOrder) => {
                                                if (err) {
                                                    console.error({
                                                        status: 0,
                                                        message: 'Error confirming Service',
                                                        error: err
                                                    });
                                                    res.status(500).json({
                                                        status: 0,
                                                        message: 'Error confirming Service',
                                                        error: 'Problem with the server'
                                                    });
                                                } else {
                                                    res.status(201).json({
                                                        status: 1,
                                                        message: 'service placed successfully',
                                                    });

                                                    let orderData = {
                                                        _id: savedOrder._id,
                                                        order_id: savedOrder.order_id,
                                                        order_status: 'placed'
                                                    }

                                                    // socketController.io.sockets.in(req.branchId).emit('update_table', orderData);
                                                    // socketController.io.sockets.in(req.branchId).emit('update_takeaway_list', orderData);
                                                    // socketController.io.sockets.in(req.orderId).emit('update_order', orderData);
                                                    socketController.io.sockets.in(req.branchId).emit('update_service', orderData);
                                                    socketController.io.sockets.in(req.branchId).emit('update_takeaway', orderData);
                                                    PushController.notifyBranchMembers(req.branchId, { message: 'Service Placed Successfully' }).then((result) => {
                                                        console.info('Table order updated by guest =========', result);
                                                    })
                                                }
                                            })
                                        } else if (orderDetails) {
                                            let lastorder;
                                            let payableServiceCost = 0;

                                            if (orderDetails.order_list.length > 0) {
                                                lastorder = orderDetails.order_list[orderDetails.order_list.length - 1];
                                                payableServices.forEach((service) => {
                                                    let serviceAsItem = {}
                                                    serviceAsItem['name'] = service.name;
                                                    serviceAsItem['selling_price'] = service.price;
                                                    serviceAsItem['sold_price'] = service.price;
                                                    // serviceAsItem['quantity'] = service.quantity;
                                                    // serviceAsItem['count'] = service.quantity;
                                                    serviceAsItem['quantity'] = 1;
                                                    serviceAsItem['count'] = 1;
                                                    serviceAsItem['food_type'] = 'Veg';
                                                    serviceAsItem['kot_number'] = orderDetails.order_list.length;
                                                    serviceAsItem['customer_id'] = service['caller_id'];
                                                    serviceAsItem['customer_name'] = service['caller_name']
                                                    lastorder.item_details.push(serviceAsItem);
                                                    payableServiceCost += service.price * (service.quantity ? service.quantity : 1)
                                                });

                                                orderDetails.total_cost = orderDetails.total_cost;
                                                orderDetails.final_cost = orderDetails.final_cost;
                                                // orderDetails.total_cost = orderDetails.total_cost + payableServiceCost;
                                                // orderDetails.final_cost = orderDetails.final_cost + payableServiceCost;
                                                orderDetails.order_list[orderDetails.order_list.length - 1] = lastorder;
                                            } else {
                                                let firstOrderList = {
                                                    order_status: 'placed',
                                                    order_type: 'take_aways',
                                                    item_details: []
                                                }
                                                orderDetails.order_list.push(firstOrderList);

                                                payableServices.forEach((service) => {
                                                    let serviceAsItem = {}
                                                    serviceAsItem['name'] = service.name;
                                                    serviceAsItem['selling_price'] = service.price;
                                                    serviceAsItem['sold_price'] = service.price;
                                                    // serviceAsItem['quantity'] = service.quantity;
                                                    // serviceAsItem['count'] = service.quantity
                                                    serviceAsItem['quantity'] = 1;
                                                    serviceAsItem['count'] = 1;
                                                    serviceAsItem['food_type'] = 'Veg';
                                                    serviceAsItem['kot_number'] = orderDetails.order_list.length;

                                                    // if(quickServiceData.takeaway_id) {
                                                    serviceAsItem['customer_id'] = service['caller_id'];
                                                    serviceAsItem['customer_name'] = service['caller_name']
                                                    // }

                                                    firstOrderList.item_details.push(serviceAsItem);
                                                    payableServiceCost += service.price * (service.quantity ? service.quantity : 1)
                                                });

                                                // orderDetails.total_cost = payableServiceCost;
                                                // orderDetails.final_cost = payableServiceCost;
                                                orderDetails.total_cost = 0;
                                                orderDetails.final_cost = 0;
                                                orderDetails.order_list[0] = firstOrderList;
                                            }

                                            // Orders.findOneAndUpdate({ 'order_id': req.orderId },
                                            Orders.findOneAndUpdate({ 'order_id': quickServiceData.type_id },
                                                { $set: { total_cost: orderDetails.total_cost, final_cost: orderDetails.final_cost, order_list: orderDetails.order_list } },
                                                { new: true },
                                                (err, savedOrder) => {
                                                    if (err) {
                                                        console.error({
                                                            status: 0,
                                                            message: 'Error confirming Service',
                                                            error: err
                                                        });
                                                        res.status(500).json({
                                                            status: 0,
                                                            message: 'Error confirming Service',
                                                            error: 'Problem with the server'
                                                        });
                                                    } else {
                                                        res.status(201).json({
                                                            status: 1,
                                                            message: 'service update successfully'
                                                        });
                                                        let orderData = {
                                                            _id: savedOrder._id,
                                                            order_id: savedOrder.order_id,
                                                            order_status: 'placed',
                                                            order: savedOrder
                                                        }

                                                        // socketController.io.sockets.in(req.branchId).emit('update_table', orderData);
                                                        // socketController.io.sockets.in(req.branchId).emit('update_takeaway_list', orderData);
                                                        // socketController.io.sockets.in(req.orderId).emit('update_order', orderData);
                                                        socketController.io.sockets.in(req.branchId).emit('update_service', orderData);
                                                        socketController.io.sockets.in(req.branchId).emit('update_takeaway', orderData);
                                                        PushController.notifyBranchMembers(req.branchId, { message: 'Service Placed Successfully' }).then((result) => {
                                                            console.info('Table order updated by guest -----------', result);
                                                        })
                                                    }
                                                })


                                            // orderDetails.save((err, savedOrder) => {
                                            //     if (err) {
                                            //         console.error({
                                            //             status: 0,
                                            //             message: 'Error confirming Service',
                                            //             error: err
                                            //         });
                                            //         res.status(500).json({
                                            //             status: 0,
                                            //             message: 'Error confirming Service',
                                            //             error: 'Problem with the server'
                                            //         });
                                            //     } else {
                                            //         res.status(201).json({
                                            //             status: 1,
                                            //             message: 'service update successfully'
                                            //         });
                                            //         let orderData = {
                                            //             _id: savedOrder._id,
                                            //             order_id: savedOrder.order_id,
                                            //             order_status: 'placed',
                                            //             order: savedOrder
                                            //         }

                                            //         // socketController.io.sockets.in(req.branchId).emit('update_table', orderData);
                                            //         // socketController.io.sockets.in(req.branchId).emit('update_takeaway_list', orderData);
                                            //         // socketController.io.sockets.in(req.orderId).emit('update_order', orderData);
                                            //         socketController.io.sockets.in(req.branchId).emit('update_service', orderData);
                                            //         socketController.io.sockets.in(req.branchId).emit('update_takeaway', orderData);

                                            //         PushController.notifyBranchMembers(req.branchId, { message: 'Service Placed Successfully' }).then((result) => {
                                            //         })       
                                            //     }
                                            // })
                                        } else {
                                            res.status(404).json({
                                                status: 1,
                                                message: 'No Service found',
                                            })
                                        }
                                    })
                                } else if (req.tableId) {
                                    Orders.findOneAndUpdate({ 'table_id': req.tableId }, { $set: { has_alert: true } }, { new: true }, (err, orderDetails) => {
                                        if (err) {
                                            console.error({
                                                status: 0,
                                                message: 'Error finding Order',
                                                error: err
                                            });
                                            res.status(500).json({
                                                status: 0,
                                                message: 'Error finding Order',
                                                error: 'Problem with the server'
                                            })
                                        } else if (!orderDetails) {
                                            //TODO: Sait as new order and put it in new KOT
                                            let orderDetails = new Orders();

                                            if (quickServiceData.table_id) {
                                                orderDetails['table_id'] = quickServiceData.table_id;
                                                orderDetails['order_id'] = null;
                                                orderDetails['delivery_id'] = null;
                                                orderDetails['order_type'] = 'in_house';
                                            } else if (quickServiceData.takeaway_id) {
                                                orderDetails['table_id'] = null;
                                                orderDetails['order_id'] = quickServiceData.takeaway_id;
                                                orderDetails['delivery_id'] = null;
                                                orderDetails['order_type'] = 'take_aways';
                                                orderDetails['delivery_address'] = {
                                                    customer_id: updatedOrder.services ? updatedOrder.services[0].caller_id : req.userId,
                                                    person_name: updatedOrder.services ? updatedOrder.services[0].caller_name : req.userName
                                                }
                                            } else if (quickServiceData.delivery_id) {
                                                //NOTE: Condition Not Exists
                                                orderDetails['table_id'] = null;
                                                orderDetails['order_id'] = null;
                                                orderDetails['delivery_id'] = quickServiceData.delivery_id;
                                                orderDetails['order_type'] = 'home_delivery';
                                            }

                                            let firstOrderList = {
                                                order_status: 'placed',
                                                order_type: 'take_aways',
                                                item_details: []
                                            }
                                            orderDetails.order_list.push(firstOrderList);

                                            let payableServiceCost = 0;

                                            payableServices.forEach((service) => {
                                                let serviceAsItem = {}
                                                serviceAsItem['name'] = service.name;
                                                serviceAsItem['selling_price'] = service.price;
                                                serviceAsItem['sold_price'] = service.price;
                                                // serviceAsItem['quantity'] = service.quantity;
                                                // serviceAsItem['count'] = service.quantity;
                                                serviceAsItem['quantity'] = 1;
                                                serviceAsItem['count'] = 1;
                                                serviceAsItem['food_type'] = 'Veg';
                                                serviceAsItem['kot_number'] = orderDetails.order_list.length;

                                                if (quickServiceData.table_id) {
                                                    serviceAsItem['customer_id'] = service['caller_id'];
                                                    serviceAsItem['customer_name'] = service['caller_name']
                                                }

                                                firstOrderList.item_details.push(serviceAsItem);
                                                payableServiceCost += service.price * (service.quantity ? service.quantity : 1)
                                            });

                                            // orderDetails.total_cost = payableServiceCost;
                                            // orderDetails.final_cost = payableServiceCost;
                                            orderDetails.total_cost = 0;
                                            orderDetails.final_cost = 0;
                                            orderDetails.branch_id = req.branchId;

                                            orderDetails.order_list[0] = firstOrderList;

                                            orderDetails.save((err, savedOrder) => {
                                                if (err) {
                                                    console.error({
                                                        status: 0,
                                                        message: 'Error confirming Service',
                                                        error: err
                                                    });
                                                    res.status(500).json({
                                                        status: 0,
                                                        message: 'Error confirming Service',
                                                        error: 'Problem with the server'
                                                    });
                                                } else {
                                                    Table.findByIdAndUpdate({ _id: savedOrder.table_id }, {
                                                        $set: { has_alert: true, table_amount: savedOrder.total_cost, total_amount: savedOrder.total_cost }
                                                    },
                                                        { new: true },
                                                        (err, response) => {
                                                            if (err) {
                                                                console.error({
                                                                    status: 0,
                                                                    message: 'Error confirming Service',
                                                                    error: err
                                                                });
                                                                res.status(500).json({
                                                                    status: 0,
                                                                    message: 'Error confirming Service',
                                                                    error: 'Problem with the server'
                                                                });
                                                            } else {
                                                                res.status(201).json({
                                                                    success: 1,
                                                                    message: 'Service Confirmed'
                                                                });
                                                                let orderData = {
                                                                    _id: savedOrder._id,
                                                                    table_id: savedOrder.table_id,
                                                                    order_status: 'placed'
                                                                }
                                                                let tableData = {
                                                                    table_id: savedOrder.table_id,
                                                                    order_status: 'placed',
                                                                    floor_id: response.floor_id,
                                                                    branch_id: req.branchId,
                                                                    socket_data: 'service_placed'
                                                                }

                                                                // socketController.io.sockets.in(req.branchId).emit('update_table', orderData);
                                                                socketController.io.sockets.in(req.branchId).emit('update_order', orderData);
                                                                // socketController.io.sockets.in(req.orderId).emit('update_order', orderData);
                                                                socketController.io.sockets.in(req.branchId).emit('update_service', orderData);
                                                                socketController.io.sockets.in(req.branchId).emit('update_table', tableData);

                                                                // PushController.notifyBranchMembers(req.branchId, { message: 'Service Placed Successfully' }).then((result) => {
                                                                //     console.info('Table order updated by guest');
                                                                // })
                                                                PushController.notifyZoneMembers(req.branchId,  savedOrder.floor_id,   savedOrder.table_id, { message: 'Service Placed Successfully' }).then((result) => {
                                                                    console.info('Table order updated by guest');
                                                                })
                                                            }
                                                        })
                                                }
                                            })
                                        } else if (orderDetails) {
                                            let lastorder;
                                            let payableServiceCost = 0;

                                            if (orderDetails.order_list.length > 0) {
                                                lastorder = orderDetails.order_list[orderDetails.order_list.length - 1];

                                                payableServices.forEach((service) => {
                                                    let serviceAsItem = {}
                                                    serviceAsItem['name'] = service.name;
                                                    serviceAsItem['selling_price'] = service.price;
                                                    serviceAsItem['sold_price'] = service.price;
                                                    // serviceAsItem['quantity'] = service.quantity;
                                                    // serviceAsItem['count'] = service.quantity;
                                                    serviceAsItem['quantity'] = 1;
                                                    serviceAsItem['count'] = 1;
                                                    serviceAsItem['food_type'] = 'Veg';
                                                    serviceAsItem['kot_number'] = orderDetails.order_list.length;
                                                    serviceAsItem['customer_id'] = service['caller_id'];
                                                    serviceAsItem['customer_name'] = service['caller_name']

                                                    lastorder.item_details.push(serviceAsItem);
                                                    payableServiceCost += service.price * (service.quantity ? service.quantity : 1)
                                                });

                                                // orderDetails.total_cost = orderDetails.total_cost + payableServiceCost;
                                                // orderDetails.final_cost = orderDetails.final_cost + payableServiceCost;
                                                orderDetails.total_cost = orderDetails.total_cost;
                                                orderDetails.final_cost = orderDetails.final_cost;
                                                orderDetails.order_list[orderDetails.order_list.length - 1] = lastorder;
                                            } else {
                                                let firstOrderList = {
                                                    order_status: 'placed',
                                                    order_type: 'take_aways',
                                                    item_details: []
                                                }
                                                orderDetails.order_list.push(firstOrderList);

                                                payableServices.forEach((service) => {
                                                    let serviceAsItem = {}
                                                    serviceAsItem['name'] = service.name;
                                                    serviceAsItem['selling_price'] = service.price;
                                                    serviceAsItem['sold_price'] = service.price;
                                                    // serviceAsItem['quantity'] = service.quantity;
                                                    // serviceAsItem['count'] = service.quantity;
                                                    serviceAsItem['quantity'] = 1;
                                                    serviceAsItem['count'] = 1;
                                                    serviceAsItem['food_type'] = 'Veg';
                                                    serviceAsItem['kot_number'] = orderDetails.order_list.length;

                                                    if (quickServiceData.table_id) {
                                                        serviceAsItem['customer_id'] = service['caller_id'];
                                                        serviceAsItem['customer_name'] = service['caller_name']
                                                    }

                                                    firstOrderList.item_details.push(serviceAsItem);
                                                    payableServiceCost += service.price * (service.quantity ? service.quantity : 1)
                                                });

                                                // orderDetails.total_cost = payableServiceCost;
                                                // orderDetails.final_cost = payableServiceCost;
                                                orderDetails.total_cost = 0;
                                                orderDetails.final_cost = 0;
                                                orderDetails.order_list[0] = firstOrderList;
                                            }

                                            Orders.findOneAndUpdate({ 'table_id': req.tableId },
                                                { $set: { total_cost: orderDetails.total_cost, final_cost: orderDetails.final_cost, order_list: orderDetails.order_list } },
                                                { new: true }, (err, savedOrder) => {
                                                    if (err) {
                                                        console.error({
                                                            status: 0,
                                                            message: 'Error confirming Service',
                                                            error: err
                                                        });
                                                        res.status(500).json({
                                                            status: 0,
                                                            message: 'Error confirming Service',
                                                            error: 'Problem with the server'
                                                        });
                                                    } else {
                                                        Table.findByIdAndUpdate({ _id: savedOrder.table_id },
                                                            { $set: { has_alert: true, table_amount: savedOrder.total_cost, total_amount: savedOrder.total_cost } },
                                                            { new: true }, (err, response) => {
                                                                if (err) {
                                                                    console.error({
                                                                        status: 0,
                                                                        message: 'Error updating service',
                                                                        error: err
                                                                    });
                                                                    res.status(500).json({
                                                                        status: 0,
                                                                        message: 'Error updating service',
                                                                        error: 'problem with the server'
                                                                    })
                                                                } else {
                                                                    res.status(201).json({
                                                                        status: 0,
                                                                        message: 'Service updated successfully',
                                                                    });
                                                                    let orderData = {
                                                                        _id: savedOrder._id,
                                                                        table_id: savedOrder.table_id,
                                                                        order_status: 'placed'
                                                                    }
                                                                    let tableData = {
                                                                        table_id: savedOrder.table_id,
                                                                        message: 'service placed successfully',
                                                                        floor_id: response.floor_id,
                                                                        branch_id: req.branchId,
                                                                        socket_data: 'service_placed'
                                                                    }

                                                                    // socketController.io.sockets.in(req.branchId).emit('update_table', orderData);
                                                                    // socketController.io.sockets.in(req.branchId).emit('update_takeaway_list', orderData);
                                                                    // socketController.io.sockets.in(req.orderId).emit('update_order', orderData);
                                                                    // socketController.io.sockets.in(req.orderId).emit('update_order', orderData);
                                                                    socketController.io.sockets.in(req.branchId).emit('update_order', orderData);
                                                                    socketController.io.sockets.in(req.branchId).emit('update_service', orderData);
                                                                    socketController.io.sockets.in(req.branchId).emit('update_table', tableData);
                                                                    // PushController.notifyBranchMembers(req.branchId, { message: 'Service Placed Successfully' }).then((result) => {
                                                                    //     console.info('Table order updated by guest');
                                                                    // })
                                                                    PushController.notifyZoneMembers(req.branchId, savedOrder.floor_id, savedOrder.table_id, { message: 'Service Placed Successfully' }).then((result) => {
                                                                        console.info('Table order updated by guest');
                                                                    })
                                                                }
                                                            })
                                                    }
                                                })
                                        } else {
                                            res.status(404).json({
                                                status: 1,
                                                message: 'No Service found',
                                            })
                                        }
                                    })
                                }
                            } else if (!payableServices.length) {
                                if (req.orderId) {
                                    Orders.findOne({ order_id: quickServiceData.type_id }, (err, existingOrder) => {
                                        if (err) {
                                            console.error({
                                                status: 0,
                                                message: 'error finding order',
                                                error: err
                                            });
                                            res.status(500).json({
                                                status: 0,
                                                message: 'error finding order',
                                                error: 'problem with the server'
                                            });
                                        } else {
                                            // existingOrder.order_status = 'placed';
                                            existingOrder.has_alert = true;
                                            existingOrder.save((err, savedOrder) => {
                                                if (err) {
                                                    console.error({
                                                        status: 0,
                                                        message: 'Error confirming service',
                                                        error: err
                                                    })
                                                    res.status(500).json({
                                                        status: 0,
                                                        message: 'Error confirming service',
                                                        error: 'Problem with the server'
                                                    })
                                                } else {

                                                    let orderData = {
                                                        _id: savedOrder._id,
                                                        order_id: savedOrder.order_id,
                                                        order_status: 'placed'
                                                    }

                                                    socketController.io.sockets.in(req.branchId).emit('update_service', orderData);
                                                    socketController.io.sockets.in(req.branchId).emit('update_takeaway', orderData);
                                                    PushController.notifyBranchMembers(req.branchId, { message: 'Service Placed Successfully' }).then((result) => {
                                                        console.info('Table order updated by guest');
                                                    })
                                                }
                                            })
                                        }
                                    })
                                } else if (req.tableId) {
                                    Orders.findOne({ 'table_id': req.tableId }, (err, orderDetails) => {
                                        if (err) {
                                            console.error({
                                                status: 0,
                                                message: 'error finding order',
                                                error: err
                                            });
                                            res.status(500).json({
                                                status: 0,
                                                message: 'error finding order',
                                                error: 'problem with the server'
                                            });
                                        } else if (orderDetails) {
                                            Table.findByIdAndUpdate({ _id: req.tableId }, {
                                                $set: { has_alert: true }
                                            },
                                                { new: true },
                                                (err, response) => {
                                                    if (err) {
                                                        console.error({
                                                            status: 0,
                                                            message: 'Error confirming Service',
                                                            error: err
                                                        });
                                                        res.status(500).json({
                                                            status: 0,
                                                            message: 'Error confirming Service',
                                                            error: 'Problem with the server'
                                                        });
                                                    } else {
                                                        res.status(201).json({
                                                            success: 1,
                                                            message: 'Service Confirmed'
                                                        });
                                                        let orderData = {
                                                            _id: orderDetails._id,
                                                            table_id: orderDetails.table_id,
                                                            order_status: 'placed'
                                                        }
                                                        let tableData = {
                                                            table_id: orderDetails.table_id,
                                                            order_status: 'placed',
                                                            floor_id: response.floor_id,
                                                            branch_id: req.branchId,
                                                            socket_data: 'service_placed'
                                                        }

                                                        // socketController.io.sockets.in(req.branchId).emit('update_table', orderData);
                                                        socketController.io.sockets.in(req.branchId).emit('update_order', orderData);
                                                        // socketController.io.sockets.in(req.orderId).emit('update_order', orderData);
                                                        socketController.io.sockets.in(req.branchId).emit('update_service', orderData);
                                                        socketController.io.sockets.in(req.branchId).emit('update_table', tableData);

                                                        // PushController.notifyBranchMembers(req.branchId, { message: 'Service Placed Successfully' }).then((result) => {
                                                        //     console.info('Table order updated by guest');
                                                        // })
                                                        PushController.notifyZoneMembers(req.branchId, response.floor_id, orderDetails.table_id, { message: 'Service Placed Successfully' }).then((result) => {
                                                            console.info('Table order updated by guest');
                                                        })
                                                    }
                                                })
                                        } else {
                                            console.error({
                                                status: 0,
                                                message: 'error finding order',
                                                error: err
                                            });
                                            res.status(404).json({
                                                status: 0,
                                                message: 'error finding order',
                                                error: 'no order found'
                                            });
                                        }
                                    })
                                } else {
                                    res.status(200).json({
                                        status: 1,
                                        message: 'Service Added successfully',
                                    });
                                }
                            } else {
                                res.status(200).json({
                                    status: 1,
                                    message: 'Service Added successfully',
                                });
                            }
                        }
                    }
                )
            }
        })
    } else if (req.accessType === 'superadmin' || req.accessType === 'admin' || req.accessType === "staffs") {
        //NOTE: Not handling this scenario as for now, the admin cannot equest for service
        // If he can the use tha above code and modify
    } else {
        console.error({
            status: 0,
            message: 'Invalid Acesss',
            error: 'Invalid access type'
        });
        res.status(401).json({
            status: 0,
            message: 'Invalid Acesss'
        })
    }
};
/**
 * Update Service Status
 */
exports.updateServiceStatus = (req, res) => {
    let quickServiceData = req.body;
    if (req.accessType === 'superadmin' || req.accessType === 'admin' || req.accessType === "staffs") {
        let query1;
        let query2;
        let paramId;
        if (quickServiceData.table_id) {
            paramId = quickServiceData.table_id;
            query1 = { 'table_id': paramId };
            query2 = { 'table_id': paramId };
        } else if (quickServiceData.takeaway_id) {
            paramId = quickServiceData.takeaway_id;
            query1 = { 'takeaway_id': paramId };
            query2 = { 'order_id': paramId };
        } else if (quickServiceData.delivery_id) {
            //NOTE: Condition Not Exists
            query1 = { 'delivery_id': paramId };
            query2 = { 'delivery_id': paramId };
        }

        QuickService.findOne(query1, (err, quickServiceDetails) => {
            if (err) {
                console.error({
                    status: 0,
                    message: 'Error Getting Serice details',
                    error: err
                });
                res.status(500).json({
                    status: 0,
                    message: 'Error Getting Serice details',
                    error: 'Problem with the server'
                });
            } else if (!quickServiceDetails) {
                res.status(404).json({
                    status: 1,
                    message: 'No Such Service call to update status',
                });
                //TODO: notify abount this service to the branch members
            } else {
                let quickServiceCost = 0;
                let lastOrderesList = [];

                quickServiceDetails.services.forEach(service => {
                    if (service.service_status === 'requested') {
                        lastOrderesList.push({ orderer_id: service.caller_id, orderer_name: service.caller_name })
                        if (!service.free_service) {
                            quickServiceCost = quickServiceCost + (service.price * service.quantity);
                        }
                    }
                    service.service_status = 'confirmed';
                });

                let personsInService = Array.from(new Set(lastOrderesList.map(orderer => {
                    return orderer.orderer_id
                }))).map(id => {
                    return {
                        orderer_id: id,
                        orderer_name: lastOrderesList.find(s => s.orderer_id == id).orderer_name
                    }
                })


                let quick_service = new QuickService(quickServiceDetails);

                quick_service.save((err, updatedOrder) => {
                    if (err) {
                        console.error({
                            status: 0,
                            message: 'Error updating service call',
                            error: err
                        });
                        res.status(500).json({
                            status: 0,
                            message: 'Error updating service call',
                            error: 'Problem with the server'
                        });
                    } else {
                        Orders.findOne(query2, (err, orderDetails) => {
                            if (err) {
                                console.error({
                                    status: 0,
                                    message: 'Error finding Order',
                                    error: err
                                });
                                res.status(500).json({
                                    status: 0,
                                    message: 'Error finding Order',
                                    error: 'Problem with the server'
                                })
                            } else if (!orderDetails) {
                                console.error({
                                    status: 0,
                                    message: 'No order found'
                                });
                                res.status(404).json({
                                    status: 0,
                                    message: 'No order found'
                                })
                            } else if (orderDetails) {
                                let orderContainsAlert = false;
                                orderDetails.order_list.forEach((l_order) => {
                                    let itemOrderCount = 0;
                                    if (l_order.order_status === 'placed' || l_order.order_status === 'confirmed') {
                                        l_order.item_details.forEach((item) => {
                                            if (!item.item_id) {
                                                item.item_status = 'active'
                                            }
                                            if (item.item_status === 'ordered') {
                                                itemOrderCount++
                                                orderContainsAlert = true
                                            }
                                        });
                                    }

                                    if (itemOrderCount > 0) {
                                        l_order.order_status = 'placed';
                                    } else {
                                        if (l_order.order_status === 'placed') {
                                            l_order.order_status = 'confirmed';
                                        }
                                    }
                                });
                            if(quickServiceCost > 0){
                                let updated_cost;

                                if (orderDetails.order_discount && orderDetails.order_discount.discount_type) {
                                    if (orderDetails.order_discount.discount_type === 'amount') {
                                        updated_cost = orderDetails.total_cost + quickServiceCost;
                                    } else if (orderDetails.order_discount.discount_type === 'percentage') {
                                        let newPrice = orderDetails.total_cost + quickServiceCost;
                                        let discountAmount = ((orderDetails.order_discount.discount_number / 100) * newPrice);
                                        updated_cost = newPrice - discountAmount;
                                    } else if (orderDetails.order_discount.discount_type === 'flat') {
                                        updated_cost = 0;
                                    } else if (orderDetails.order_discount.discount_type === 'new_value') {
                                        // updated_cost = orderDetails.total_cost + quickServiceCost;
                                        updated_cost = orderDetails.order_discount.discount_number;
                                    }
                                } else {
                                    updated_cost = orderDetails.total_cost + quickServiceCost;
                                }

                                if (orderDetails.item_discounts && orderDetails.item_discounts.total_discount) {
                                    updated_cost = updated_cost - orderDetails.item_discounts.total_discount;
                                }

                                
                                // orderDetails.order_status = 'confirmed';
                                orderDetails.has_alert = orderContainsAlert;
                                orderDetails.total_cost = (orderDetails.total_cost + quickServiceCost);
                                orderDetails.final_cost = updated_cost;
                                orderDetails.service_charge_amount = 0;
                                orderDetails.grand_total = updated_cost;
                                
                                if (orderDetails.is_applied_service_charge) {
                                    orderDetails.service_charge_amount = updated_cost * (orderDetails.service_charge_percentage / 100);
                                    orderDetails.grand_total = updated_cost + orderDetails.service_charge_amount
                                }
                            }
                                let setOptions = { 
                                    has_alert: orderDetails.has_alert, 
                                    total_cost: orderDetails.total_cost, 
                                    final_cost: orderDetails.final_cost, 
                                    order_list: orderDetails.order_list,
                                    service_charge_amount: orderDetails.service_charge_amount,
                                    grand_total: orderDetails.grand_total 
                                } 

                                // orderDetails.grand_total: total_cost_after_dicount + total_bill_tax_cost,


                                // orderDetails.save((err,savedOrder) => {
                                Orders.findOneAndUpdate(query2,
                                    { $set: setOptions },
                                    { new: true }, (err, savedOrder) => {
                                        if (err) {
                                            console.error({
                                                status: 0,
                                                message: 'Error updating service',
                                                error: err
                                            });
                                            res.status(500).json({
                                                status: 0,
                                                message: 'Error updating service',
                                                error: 'Problem with the server'
                                            })
                                        } else {
                                            if (savedOrder.table_id) {
                                                Table.findOneAndUpdate({ _id: savedOrder.table_id },
                                                    { $set: { has_alert: orderContainsAlert, table_amount: savedOrder.grand_total, total_amount: savedOrder.grand_total } },
                                                    { new: true }, (err, updatedTable) => {
                                                        if (err) {
                                                            console.error({
                                                                status: 0,
                                                                message: 'error updating table',
                                                                error: err
                                                            });
                                                            res.status(500).error({
                                                                status: 0,
                                                                message: 'error updating table',
                                                                error: 'problem with the server'
                                                            })
                                                        } else {
                                                            res.status(200).json({
                                                                status: 1,
                                                                message: 'service placed successfully'
                                                            });
                                                            let orderData = {
                                                                _id: savedOrder._id,
                                                                order_id: savedOrder.order_id,
                                                                order_status: 'placed'
                                                            }

                                                            let tableData = {
                                                                table_id: savedOrder.table_id,
                                                                order_status: 'service_confirmed',
                                                                floor_id: updatedTable.floor_id,
                                                                branch_id: savedOrder.branch_id,
                                                                persons_in_service: personsInService ? personsInService : []
                                                            }

                                                            socketController.io.sockets.in(savedOrder.branch_id).emit('update_service', orderData);
                                                            socketController.io.sockets.in(savedOrder.branch_id).emit('update_table', tableData);
                                                            socketController.io.sockets.in(savedOrder.table_id).emit('update_table', tableData);

                                                            // PushController.notifyBranchMembers(savedOrder.branch_id, { message: 'Service Confirmed' }).then((result) => {
                                                            //     console.info('Table order updated by guest');
                                                            // })
                                                            PushController.notifyZoneMembers(savedOrder.branch_id, updatedTable.floor_id, savedOrder.table_id, { message: 'Service Confirmed' }).then((result) => {
                                                                console.info('Table order updated by guest');
                                                            })
                                                        }
                                                    })
                                            } else {
                                                res.status(201).json({
                                                    status: 1,
                                                    message: 'Service Updated successfully',
                                                });
                                                let orderData = {
                                                    _id: savedOrder._id,
                                                    order_id: savedOrder.order_id,
                                                    order_status: 'placed'
                                                }

                                                let userData = {
                                                    _id: savedOrder._id,
                                                    order_id: savedOrder.order_id,
                                                    order_status: 'service_confirmed',
                                                    persons_in_service: personsInService ? personsInService : []
                                                }

                                                socketController.io.sockets.in(savedOrder.branch_id).emit('update_service', orderData);
                                                socketController.io.sockets.in(savedOrder.branch_id).emit('update_takeaway', orderData);

                                                if (savedOrder.order_id) {
                                                    socketController.io.sockets.in(savedOrder.order_id).emit('update_takeaway', userData);
                                                }

                                                PushController.notifyBranchMembers(savedOrder.branch_id, { message: 'Service Confirmed' }).then((result) => {
                                                    console.info('Table order updated by guest');
                                                })
                                            }
                                        }
                                    })
                            } else {
                                res.status(404).json({
                                    status: 1,
                                    message: 'No order found',
                                })
                            }
                        })
                    }
                })
            }
        })
    } else {
        console.error({
            status: 0,
            message: 'Invalid Acesss',
            error: 'Invalid access type'
        });
        res.status(401).json({
            status: 0,
            message: 'Invalid Acesss'
        })
    }
}
/**
 * Remove Quick Service
 */
exports.removeQuickService = (req, res) => {

}

/**
 * Quick Service History
 */
exports.addServiceToHistory = (req, res) => {

}