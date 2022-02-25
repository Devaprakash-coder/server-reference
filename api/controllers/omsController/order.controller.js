"use strict";

/** Dependencies */
const mongoose = require("mongoose");

/** Controllers  */
const socketController = require("../common/socket.controller");
const PushController = require("../common/push.controller");
const TableController = require("./table.controller");

/** Models */
const Order = require("../../models/omsModels/order.model");
const Table = require("../../models/omsModels/table.model");
const Bill = require("../../models/omsModels/bill.model");
const HistoryOrders = require("../../models/history/omsModels/order_history.model");
const HistoryBills = require("../../models/history/omsModels/bill_history.model");
const QuickService = require("../../models/omsModels/quick_service.model");
const QuickServiceHistory = require("../../models/history/omsModels/quick_services_history.model");
const Customer = require('../../models/managementModels/customer_directory.model');
const MenuItemController = require('../../models/managementModels/menu_item.model');
const Branches = require('../../models/branch.model');
const Recipes = require('../../models/managementModels/inventory/recipes.model');
const MaterialStocks = require('../../models/managementModels/inventory/material_stocks.model');
const CompanyModel = require('../../models/company.model');


/**
 * @description Get Orders of Company
 * @param {comapnyId} req 
 */
exports.getAllOrders = (req, res) => {
	Order.find({ company_id: req.companyId }, (err, orders) => {
		if (err) {
			console.error({
				status: 0,
				message: "Error getting All orders",
				error: err
			});
			res.status(500).json({
				status: 0,
				message: "Error getting All orders",
				error: "Problem with the server"
			});
		}
		res.status(200).json({
			status: 1,
			message: "Orders Obtained Successfully",
			orders: orders
		});
	});
};

/**
 * @description Get Orders of a Branch
 * @param { branchId, paramId, orderType } req 
 */
exports.getBranchOrders = async (req, res) => {
	let branchId = "";
	let paramId = "";
	let orderType = "";

	if (req.accessType === "superadmin" || req.accessType === "admin" || req.accessType === "staffs") {
		if (!req.params.param1 && !req.params.param2) {
			/** @condition : `superadmin` should pass param1 || param2 by default get the details */
			console.error({
				status: 0,
				message: "Check the URL",
				error:
					"Invalid URL, url should be param 1 (branchId) , param 2 (tableId)"
			});
			res.status(400).json({
				status: 0,
				message: "Check the URL",
				error: "Invalid request params"
			});
		} else if (req.params.param1 && !req.params.param2) {
			/** @condition : contains branchId, but no table or order id */
			/** @action : send branch details alone */
			branchId = req.params.param1;
			await getBranchOrders();
		} else if (req.params.param1 && req.params.param2) {
			/** @condition : contains both param1 and param2 */
			/** @action should send orders of the particular param2(_id) */
			branchId = req.params.param1;
			paramId = req.params.param2;
			if (req.params.param3) {
				if (req.params.param3 === "completed" || req.params.param3 === "placed" || req.params.param3 === "confirmed") {
					/** @action : get orders based on a particular sent type */
					orderType = req.params.param3;
					await getOrderByType(orderType);
				} else {
					console.error({
						status: 0,
						message: "Invalid type",
						error:
							"Invalid URL, url should be param 1 (branchId) , param 2 (tableId)"
					});
					res.status(400).json({
						status: 0,
						message: "Check the URL",
						error: "Invalid request params"
					});
				}
			} else {
				await getOrders();
			}
		}
	} else if (req.accessType === "guest") {
		/** @condition : if the request is from `guest` */
		branchId = req.branchId;
		paramId = req.params.param1;

		if (req.params.param1 && req.params.param2) {
			if (req.params.param2 === "completed" || req.params.param2 === "placed" || req.params.param2 === "confirmed") {
				orderType = req.params.param2;
				await getOrderByType(orderType);
			} else {
				/** @condition : unkown order type */
				console.error({
					status: 0,
					message: "Check the URL",
					error:
						"Invalid URL, url should be param 1 (branchId) , param 2 (tableId), Opt param 3 (type)"
				});
				res.status(400).json({
					status: 0,
					message: "Check the URL",
					error: "Invalid request params"
				});
			}
		} else if (req.params.param1 && !req.params.param2) {
			await getOrders();
		} else {
			/** @condition : no params passed from the guest */
			console.error({
				status: 0,
				message: "Invalid Parameters",
				error: "Invalid Paramters"
			});
			res.status(400).json({
				status: 0,
				message: "Invalid Parameters",
				error: "Invalid Paramters"
			});
		}
	} else {
		/** @condition : improper access type */
		console.error({
			status: 0,
			message: "No Permission Required",
			error: "Access Denied"
		});
		res.status(401).json({
			status: 0,
			message: "No Permission Required",
			error: "Access Denied"
		});
	}

	async function getOrderByType(type) {
		let query;
		if (paramId.startsWith("TA")) {
			query = { order_id: paramId, branch_id: branchId };
		} else if (paramId.startsWith("HD")) {
			query = { delivery_id: paramId, branch_id: branchId };
		} else {
			query = { table_id: paramId, branch_id: branchId };
		}

		if (type === "confirmed") {
			await Order.aggregate(
				[
					{ $match: query },
					{
						$project: {
							order_list: {
								$filter: {
									input: "$order_list",
									as: "new_list",
									cond: {
										$or: [
											{ $eq: ["$$new_list.order_status", "confirmed"] },
											{ $eq: ["$$new_list.order_status", "served"] }
										]
									}
								}
							},
							order_number: 1,
							order_discount: 1,
							item_discounts: 1,
							order_tax_details: 1,
							order_tax_amount: 1,
							is_applied_service_charge: 1,
							service_charge_percentage: 1,
							grand_total: 1,
							service_charge_amount: 1,
							total_after_incl_tax: 1,
							total_cost_after_dicount: 1,
							final_cost: 1,
							total_cost: 1
						}
					}
				],
				async (err, filteredOrders) => {
					if (err) {
						console.error({
							status: 0,
							message: "Error getting Orders by type",
							error: "Problem getting error based on type"
						});
						res.status(500).json({
							status: 0,
							message: "Error getting Orders by type",
							error: "Problem with the server"
						});
					} else if (!filteredOrders.length) {
						console.error({
							status: 0,
							message: "No Orders Found for the particular Type",
							error: "No Orders Found for the particular Type"
						});
						res.status(200).json({
							status: 0,
							message: "No Orders Found for the particular Type"
							// orders: null
						});
					} else {
						if (req.accessType === "guest") {
							await modifyContentforGuest(filteredOrders[0]).then(result => {
								let UpdatedTableOrder = result;
								res.status(200).json({
									status: 1,
									message: "Orders Obtained Successfully",
									orders: UpdatedTableOrder
								});
							});
						} else {
							res.status(200).json({
								status: 0,
								message: "No Orders Found for the particular ID"
								// orders: filteredOrders
							});
						}
					}
				}
			);
		} else {
			Order.aggregate(
				[
					{ $match: query },
					{
						$project: {
							order_list: {
								$filter: {
									input: "$order_list",
									as: "new_list",
									cond: { $eq: ["$$new_list.order_status", type] }
								}
							},
							order_number: 1
						}
					}
				],
				async (err, filteredOrders) => {
					if (err) {
						console.error({
							status: 0,
							message: "Error getting Orders by type",
							error: err
						});
						res.status(500).json({
							status: 0,
							message: "Error getting Orders by type",
							error: "Problem with the server"
						});
					} else if (!filteredOrders.length) {
						console.error({
							status: 0,
							message: "No Orders Found for the particular Type",
							error: "No Orders Found for the particular Type"
						});
						res.status(200).json({
							status: 0,
							message: "No Orders Found for the particular Type"
							// orders: null
						});
					} else {
						if (req.accessType === "guest") {
							await modifyContentforGuest(filteredOrders[0]).then(result => {
								let UpdatedTableOrder = result;
								res.status(200).json({
									status: 1,
									message: "Orders Obtained Successfully",
									orders: UpdatedTableOrder
								});
							});
						} else {
							res.status(200).json({
								status: 0,
								message: "No Orders Found for the particular ID"
								// orders: filteredOrders
							});
						}
					}
				}
			);
		}
	}

	async function getOrders() {
		let query;
		if (paramId.startsWith("TA")) {
			query = { order_id: paramId, branch_id: branchId };
		} else if (paramId.startsWith("HD")) {
			query = { delivery_id: paramId, branch_id: branchId };
		} else {
			query = { table_id: paramId, branch_id: branchId };
		}

		Order.findOne(query).populate('order_list.kot_confirmed_by', 'name position').exec((err, tableOrder) => {
			if (err) {
				console.error({
					status: 0,
					message: "Error getting branch Orders",
					error: err
				});
				res.status(500).json({
					status: 0,
					message: "Error getting branch Orders",
					error: "Problem with the server"
				});
			} else if (!tableOrder) {
				console.error({
					status: 1,
					message: "No Orders Found for the particular ID 1",
					error: err
				});
				res.status(200).json({
					status: 1,
					message: "No Orders Found for the particular ID 2"
					// orders: tableOrder
				});
			} else {
				if (req.accessType === "guest") {
					modifyContentforGuest(tableOrder).then(result => {
						let UpdatedTableOrder = result;
						res.status(200).json({
							status: 1,
							message: "Orders Obtained Successfully",
							orders: UpdatedTableOrder
						});
					});
				} else {
					res.status(200).json({
						status: 1,
						message: "Order Obtained Successfully",
						orders: tableOrder
					});
				}
			}
		});
	}

	async function getBranchOrders() {
		Order.find({ branch_id: branchId }, (err, branchOrders) => {
			if (err) {
				console.error({
					status: 0,
					message: "Error getting branch Orders",
					error: err
				});
				res.status(500).json({
					status: 0,
					message: "Error getting branch Orders",
					error: "Problem with the server"
				});
			} else if (!branchOrders) {
				console.error({
					status: 1,
					message: "No Orders Found for the particular ID",
					error: err
				});
				res.status(200).json({
					status: 1,
					message: "No Orders Found for the particular ID"
				});
			} else {
				if (req.accessType === "guest") {
					modifyContentforGuest(branchOrders).then(result => {
						let UpdatedTableOrder = result;
						res.status(200).json({
							status: 1,
							message: "Orders Obtained Successfully",
							orders: UpdatedTableOrder
						});
					});
				} else {
					res.status(200).json({
						status: 1,
						message: "Order Obtained Successfully",
						orders: branchOrders
					});
				}
			}
		});
	}

	async function modifyContentforGuest(tableOrder) {

		let itemBill = [];
		let total_item_count = 0;
		await tableOrder.order_list.map(async order => {
			itemBill.order_status = order.order_status;
			order.order_status = order.order_status;

			await order.item_details.forEach(async item => {
				total_item_count = total_item_count + item.quantity;
				let temp_obj = {
					item_status: item.item_status,
					item_name: item.name,
					skucode : item.skucode ? item.skucode: null,
					food_type: item.food_type,
					kot_order: item.kot_order,
					combo_menu: item.combo_menu,
					requests: item.requests,
					selling_price: item.selling_price,
					sold_price: item.sold_price,
					quantity: item.quantity,
					orderer_id: item.customer_id ? item.customer_id : null,
					orderer_name: item.customer_name ? item.customer_name : null,
					addons: [],
					tax_rates: item.tax_rates ? item.tax_rates : [],
					item_external_status : item.item_external_status?item.item_external_status:false,
				};
				if (item.applied_addons.length) {
					await item.applied_addons.forEach(addon => {
						let temp_addons = {
							addon_heading: addon.heading,
							addon_name: addon.name,
							addon_price: addon.price,
							addon_type: addon.type,
							addon_quantity: 1
						};
						temp_obj.addons.push(temp_addons);
					});
				}

				itemBill.push(temp_obj);
			});
			return order;
		});

		var spliteditem = [];
		for (var i = 0; i < itemBill.length; i++) {
			let existingUserIndex = CheckuserInBill(itemBill[i].orderer_id);
			if (existingUserIndex !== undefined) {
				spliteditem[existingUserIndex].bill_cost +=
					itemBill[i].sold_price * itemBill[i].quantity;
				spliteditem[existingUserIndex].item_list.push(itemBill[i]);
			} else {
				let isCurrentUser;
				if (req.tableId) {
					isCurrentUser = req.userId === itemBill[i].orderer_id;
				} else if (req.orderId) {
					isCurrentUser = true;
				}
				spliteditem.push({
					// spliteditem[existingUserIndex].bill_cost += itemBill[i].sold_price;
					user_id: itemBill[i].orderer_id,
					user_name: itemBill[i].orderer_name,
					order_status: itemBill.order_status,
					item_list: [itemBill[i]],
					bill_cost: itemBill[i].sold_price * itemBill[i].quantity,
					current_user: isCurrentUser
				});
			}
		}

		function CheckuserInBill(userId) {
			for (let k = 0; k < spliteditem.length; k++) {
				if (spliteditem[k].user_id === userId) {
					return k;
				}
			}
		}

		let UpdatedTableOrder = JSON.parse(JSON.stringify(tableOrder));
		UpdatedTableOrder.order_list = spliteditem;
		UpdatedTableOrder.total_item_count = total_item_count;
		UpdatedTableOrder.order_number = tableOrder.order_number ? tableOrder.order_number : 'not available';

		return UpdatedTableOrder;
	}

	/**
	 * @deprecated : using modifyContentforGuest instead 
	 */
	async function modifyContentforGuestBkp(tableOrder) {
		// let updatedOrderList;
		let itemBill = [];
		let total_item_count = 0;
		await tableOrder.order_list.map(async order => {
			itemBill.order_status = order.order_status;
			order.order_status = order.order_status;

			await order.item_details.forEach(async item => {
				total_item_count = total_item_count + item.quantity;
				let temp_obj = {
					item_status: item.item_status,
					item_name: item.name,
					skucode : item.skucode ? item.skucode: null,
					food_type: item.food_type,
					kot_order: item.kot_order,
					combo_menu: item.combo_menu,
					requests: item.requests,
					selling_price: item.selling_price,
					sold_price: item.sold_price,
					quantity: item.quantity,
					orderer_id: item.customer_id ? item.customer_id : null,
					orderer_name: item.customer_name ? item.customer_name : null,
					addons: [],
					tax_rates: item.tax_rates ? item.tax_rates : [],
					item_external_status : item.item_external_status?item.item_external_status:false,
				};
				if (item.applied_addons.length) {
					await item.applied_addons.forEach(addon => {
						let temp_addons = {
							addon_heading: addon.heading,
							addon_name: addon.name,
							addon_price: addon.price,
							addon_type: addon.type,
							addon_quantity: 1
						};
						temp_obj.addons.push(temp_addons);
					});
				}

				itemBill.push(temp_obj);
			});
			return order;
		});

		// updatedOrderList.itemBill = itemBill;

		var spliteditem = [];
		for (var i = 0; i < itemBill.length; i++) {
			let existingUserIndex = CheckuserInBill(itemBill[i].orderer_id);
			if (existingUserIndex !== undefined) {
				spliteditem[existingUserIndex].bill_cost +=
					itemBill[i].sold_price * itemBill[i].quantity;
				spliteditem[existingUserIndex].item_list.push(itemBill[i]);
			} else {
				let isCurrentUser;
				if (req.tableId) {
					isCurrentUser = req.userId === itemBill[i].orderer_id;
				} else if (req.orderId) {
					isCurrentUser = true;
				}
				spliteditem.push({
					// spliteditem[existingUserIndex].bill_cost += itemBill[i].sold_price;
					user_id: itemBill[i].orderer_id,
					user_name: itemBill[i].orderer_name,
					order_status: itemBill.order_status,
					item_list: [itemBill[i]],
					bill_cost: itemBill[i].sold_price * itemBill[i].quantity,
					current_user: isCurrentUser
				});
			}
		}

		function CheckuserInBill(userId) {
			for (let k = 0; k < spliteditem.length; k++) {
				if (spliteditem[k].user_id === userId) {
					return k;
				}
			}
		}

		let UpdatedTableOrder = JSON.parse(JSON.stringify(tableOrder));

		UpdatedTableOrder.order_list = spliteditem;

		if (spliteditem.length > 1) {
			// let temp_var = spliteditem.reduce((a, b) => {
			//   // return a.bill_cost + b.bill_cost
			// });
			let final_cost = 0;
			spliteditem.map(item => {
				final_cost = final_cost + item.bill_cost;
			});

			UpdatedTableOrder.final_cost = final_cost;
		} else {
			if (spliteditem[0]) {
				UpdatedTableOrder.final_cost = spliteditem[0].bill_cost;
			} else {
				UpdatedTableOrder.final_cost = 0;
			}
		}

		UpdatedTableOrder.total_item_count = total_item_count;
		UpdatedTableOrder.order_number = tableOrder.order_number ? tableOrder.order_number : 'not available';

		return UpdatedTableOrder;
	}
};

exports.updateOrderById = async (req, res) => {
	console.log('updateOrderById________req===============',req.body);
	console.log('updateOrderById________req>>>params===============',req.params);
	try {
	  let product = await Order.findByIdAndUpdate(req.params.orderId, {
		$set: req.body,
	  });
	  console.log('updateOrderById________product===============',product);
	  
	  res.status(201).json({
		status: 1,
		message: "Product Updated",
		data: product,
	  });
	} catch (err) {
	  res.status(500).json({
		status: 0,
		message: "Failed To Update",
		error: err,
	  });
	}
  };

/** @description : Get Order based on Id */
exports.getOrderById = (req, res) => {
	let orderId = req.params.orderId;
	Order.findById(orderId, (err, order) => {
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
		} else if (order) {
			let modified_order_details = {
				order_status: order.order_status,
				order_discount: order.order_discount,
				order_list: order.order_list,
				_id: order._id,
				order_type: order.order_type,
				ordered_time: order.ordered_time,
				total_cost: order.total_cost,
				final_cost: order.final_cost,
				order_number: order.order_number,
				is_applied_service_charge: order.is_applied_service_charge,
				service_charge_percentage: order.service_charge_percentage,
				service_charge_amount: order.service_charge_amount,
				order_tax_details: order.order_tax_details,
				item_discounts: order.item_discounts,
				order_tax_amount: order.order_tax_amount,
				total_cost_after_dicount: order.total_cost_after_dicount,
				total_after_incl_tax: order.total_after_incl_tax,
				grand_total: order.grand_total
			}
			res.status(200).json({
				status: 1,
				message: 'order obtained successfully',
				order: modified_order_details
			});
		} else {
			res.status(404).json({
				status: 1,
				message: 'error finding order',
				error: 'no order found'
			});
		}
	});
};

exports.getUserOrders = (req, res) => {
	if (req.accessType === "guest") {
		let userId = req.userId;
		Order.find(
			{ "order_list.item_details.customer_id": userId },
			(err, userOrder) => {
				res.status(200).json({
					status: 1,
					message: "get order history working fine",
					orders: userOrder
				});
			}
		);
	} else {
		res.status(401).json({
			status: 1,
			message: "invalid access"
		});
	}
};

/**
 * Get All Orders of Users including live and their history
 */
exports.getAllOrdersOfUser = async (req, res) => {
	if (req.accessType === "guest") {
		let userId = req.userId;
		let paginationCount = req.params.paginationCount;
		if (!paginationCount) {
			let live_orders;
			try {
				live_orders = await Order.aggregate([
					{ $match: { "order_list.item_details.customer_id": userId, branch_id: req.branchId } },
					{ $unwind: '$order_list' },
					{ $unwind: '$order_list.item_details' },
					{
						$project: {
							order_number: 1, order_status: 1, is_order_paid: 1, _id: 1, order_type: 1,
							order_id: 1, table_id: 1, delivery_id: 1, ordered_time: 1, is_live: 1,
							is_applied_service_charge: 1, service_charge_percentage: 1, service_charge_amount: 1,
							order_tax_details: 1, item_discounts: 1, order_tax_amount: 1,
							total_cost: 1, total_cost_after_dicount: 1,
							total_after_incl_tax: 1, final_cost: 1, grand_total: 1,
							'order_list.item_details.name': 1, 'order_list.item_details.quantity': 1
						}
					},
					{
						"$group": {
							"_id": "$_id",
							"item_list": { $push: '$order_list.item_details' },
							"order_number": { $first: '$order_number' },
							"order_status": { $first: '$order_status' },
							"is_order_paid": { $first: '$is_order_paid' },
							"order_type": { $first: '$order_type' },
							"order_id": { $first: '$order_id' },
							"table_id": { $first: '$table_id' },
							"delivery_id": { $first: '$delivery_id' },
							"ordered_time": { $first: '$ordered_time' },

							"is_applied_service_charge": { $first: '$is_applied_service_charge' },
							"service_charge_percentage": { $first: '$service_charge_percentage' },
							"service_charge_amount": { $first: '$service_charge_amount' },
							"order_tax_details": { $first: '$order_tax_details' },
							"item_discounts": { $first: '$item_discounts' },
							"order_tax_amount": { $first: '$order_tax_amount' },
							"total_cost": { $first: '$total_cost' },
							"total_cost_after_dicount": { $first: '$total_cost_after_dicount' },
							"total_after_incl_tax": { $first: '$total_after_incl_tax' },
							"final_cost": { $first: '$final_cost' },
							"grand_total": { $first: '$grand_total' }
						},
					}
				]).sort({ ordered_time: -1 });
			} catch {
				console.error({
					status: 0,
					message: 'error finding orders',
					error: 'problem with the server'
				});
				res.status(500).json({
					status: 0,
					message: 'error finding orders',
					error: 'problem with the server'
				});
				return;
			}
			let previous_orders = [];
			try {
				previous_orders = await HistoryOrders.aggregate([
					{ $match: { "order_list.item_details.customer_id": userId, branch_id: req.branchId } },
					{ $unwind: '$order_list' },
					{ $unwind: '$order_list.item_details' },
					{
						$project: {
							order_number: 1, order_status: 1, is_order_paid: 1, _id: 1, order_type: 1,
							order_id: 1, table_id: 1, delivery_id: 1, ordered_time: 1, is_live: 1,
							is_applied_service_charge: 1, service_charge_percentage: 1, service_charge_amount: 1,
							order_tax_details: 1, item_discounts: 1, order_tax_amount: 1,
							total_cost: 1, total_cost_after_dicount: 1,
							total_after_incl_tax: 1, final_cost: 1, grand_total: 1,
							'order_list.item_details.name': 1, 'order_list.item_details.quantity': 1
						}
					},
					{
						"$group": {
							"_id": "$_id",
							"item_list": { $push: '$order_list.item_details' },
							"order_number": { $first: '$order_number' },
							"order_status": { $first: '$order_status' },
							"is_order_paid": { $first: '$is_order_paid' },
							"order_type": { $first: '$order_type' },
							"order_id": { $first: '$order_id' },
							"table_id": { $first: '$table_id' },
							"delivery_id": { $first: '$delivery_id' },
							"ordered_time": { $first: '$ordered_time' },

							"is_applied_service_charge": { $first: '$is_applied_service_charge' },
							"service_charge_percentage": { $first: '$service_charge_percentage' },
							"service_charge_amount": { $first: '$service_charge_amount' },
							"order_tax_details": { $first: '$order_tax_details' },
							"item_discounts": { $first: '$item_discounts' },
							"order_tax_amount": { $first: '$order_tax_amount' },
							"total_cost": { $first: '$total_cost' },
							"total_cost_after_dicount": { $first: '$total_cost_after_dicount' },
							"total_after_incl_tax": { $first: '$total_after_incl_tax' },
							"final_cost": { $first: '$final_cost' },
							"grand_total": { $first: '$grand_total' }
						},
					}
				]).sort({ ordered_time: -1 });
			} catch {
				console.error({
					status: 0,
					message: 'error finding orders',
					error: 'problem with the server'
				});
				res.status(500).json({
					status: 0,
					message: 'error finding orders',
					error: 'problem with the server'
				});
				return;
			}
			let complete_order = live_orders.map((live_order) => {
				live_order.is_live = true;
				// live_order.delivery_address = live_order.delivery_address ? live_order.delivery_address : null;
				return live_order;
			}).concat(previous_orders.map((history_order) => {
				history_order.is_live = false;
				// history_order.delivery_address = history_order.delivery_address ? history_order.delivery_address : null;
				return history_order;
			}));

			res.status(200).json({
				status: 1,
				message: "your completed order history obtained successfully",
				orders: complete_order
			});
		} else {
			//NOTE: This will limit the response with the help of paginationCount
			let live_orders;
			try {
				live_orders = await Order.aggregate([
					{ $match: { "order_list.item_details.customer_id": userId, branch_id: req.branchId } },
					{ $unwind: '$order_list' },
					{ $unwind: '$order_list.item_details' },
					{
						$project: {
							order_number: 1, order_status: 1, is_order_paid: 1, _id: 1, order_type: 1,
							order_id: 1, table_id: 1, delivery_id: 1, ordered_time: 1, is_live: 1,
							is_applied_service_charge: 1, service_charge_percentage: 1, service_charge_amount: 1,
							order_tax_details: 1, item_discounts: 1, order_tax_amount: 1,
							total_cost: 1, total_cost_after_dicount: 1,
							total_after_incl_tax: 1, final_cost: 1, grand_total: 1,
							'order_list.item_details.name': 1, 'order_list.item_details.quantity': 1
						}
					},
					{
						"$group": {
							"_id": "$_id",
							"item_list": { $push: '$order_list.item_details' },
							"order_number": { $first: '$order_number' },
							"order_status": { $first: '$order_status' },
							"is_order_paid": { $first: '$is_order_paid' },
							"order_type": { $first: '$order_type' },
							"order_id": { $first: '$order_id' },
							"table_id": { $first: '$table_id' },
							"delivery_id": { $first: '$delivery_id' },
							"ordered_time": { $first: '$ordered_time' },

							"is_applied_service_charge": { $first: '$is_applied_service_charge' },
							"service_charge_percentage": { $first: '$service_charge_percentage' },
							"service_charge_amount": { $first: '$service_charge_amount' },
							"order_tax_details": { $first: '$order_tax_details' },
							"item_discounts": { $first: '$item_discounts' },
							"order_tax_amount": { $first: '$order_tax_amount' },
							"total_cost": { $first: '$total_cost' },
							"total_cost_after_dicount": { $first: '$total_cost_after_dicount' },
							"total_after_incl_tax": { $first: '$total_after_incl_tax' },
							"final_cost": { $first: '$final_cost' },
							"grand_total": { $first: '$grand_total' }
						},
					}
				]).sort({ ordered_time: -1 });
			} catch (error) {
				console.error({
					status: 0,
					message: 'error finding orders',
					error: error
				});
				res.status(500).json({
					status: 0,
					message: 'error finding orders',
					error: 'problem with the server'
				});
				return;
			}
			let previous_orders = [];
			try {
				previous_orders = await HistoryOrders.aggregate([
					{ $match: { "order_list.item_details.customer_id": userId, branch_id: req.branchId } },
					{ $unwind: '$order_list' },
					{ $unwind: '$order_list.item_details' },
					{
						$project: {
							order_number: 1, order_status: 1, is_order_paid: 1, _id: 1, order_type: 1,
							order_id: 1, table_id: 1, delivery_id: 1, ordered_time: 1, is_live: 1, final_cost: 1,
							is_applied_service_charge: 1, service_charge_percentage: 1, service_charge_amount: 1,
							order_tax_details: 1, item_discounts: 1, order_tax_amount: 1,
							total_cost: 1, total_cost_after_dicount: 1,
							total_after_incl_tax: 1, final_cost: 1, grand_total: 1,
							'order_list.item_details.name': 1, 'order_list.item_details.quantity': 1
						}
					},
					{
						"$group": {
							"_id": "$_id",
							"item_list": { $push: '$order_list.item_details' },
							"order_number": { $first: '$order_number' },
							"order_status": { $first: '$order_status' },
							"is_order_paid": { $first: '$is_order_paid' },
							"order_type": { $first: '$order_type' },
							"order_id": { $first: '$order_id' },
							"table_id": { $first: '$table_id' },
							"delivery_id": { $first: '$delivery_id' },
							"ordered_time": { $first: '$ordered_time' },

							"is_applied_service_charge": { $first: '$is_applied_service_charge' },
							"service_charge_percentage": { $first: '$service_charge_percentage' },
							"service_charge_amount": { $first: '$service_charge_amount' },
							"order_tax_details": { $first: '$order_tax_details' },
							"item_discounts": { $first: '$item_discounts' },
							"order_tax_amount": { $first: '$order_tax_amount' },
							"total_cost": { $first: '$total_cost' },
							"total_cost_after_dicount": { $first: '$total_cost_after_dicount' },
							"total_after_incl_tax": { $first: '$total_after_incl_tax' },
							"final_cost": { $first: '$final_cost' },
							"grand_total": { $first: '$grand_total' }
						},
					}
				]).sort({ ordered_time: -1 }).skip(paginationCount > 0 ? (paginationCount - 1) : 0).limit(10);
			} catch (error) {
				console.error({
					status: 0,
					message: 'error finding orders history',
					error: error
				});
				res.status(500).json({
					status: 0,
					message: 'error finding orders history',
					error: 'problem with the server'
				});
				return;
			}

			let complete_order = live_orders.map((live_order) => {
				live_order.is_live = true;
				// live_order.delivery_address = live_order.delivery_address ? live_order.delivery_address : null;
				return live_order;
			}).concat(previous_orders.map((history_order) => {
				history_order.is_live = false;
				// history_order.delivery_address = history_order.delivery_address ? history_order.delivery_address : null;
				return history_order;
			}));
			res.status(200).json({
				status: 1,
				message: "your completed order history obtained successfully 2",
				orders_count: complete_order.length,
				orders: complete_order
			});
		}
	} else {
		res.status(401).json({
			status: 1,
			message: "invalid access"
		});
	}
};

/**
 * @deprecated :
 * Since we handle both the Update and add on a single API we Used to depricate this API
 */
exports.addOrder = (req, res) => {
	let orderDetails = req.body.order_details;

	orderDetails["company_id"] = req.companyId;
	if (req.accessType === "superadmin" || req.accessType === "admin" || req.accessType === "staffs") {
		orderDetails["branch_id"] = orderDetails.branch_id;
	} else if (req.accessType === "guest") {
		orderDetails["branch_id"] = req.branchId;
		orderDetails["table_id"] = req.tableId;
		orderDetails["order_list"].customer_id = req.userId;
		orderDetails["order_list"].customer_name = req.userName;
	} else {
		res.status(401).json({
			status: 0,
			message: "Unauthorized Access"
		});
	}

	let order = new Order(orderDetails);

	order.save((err, addedOrder) => {
		if (err) {
			console.error({
				status: 0,
				message: "Error getting Takeaway orders",
				error: err
			});
			res.status(500).json({
				status: 0,
				message: "Error getting Takeaway orders",
				error: "Problem with the server"
			});
		}
		res.status(201).json({
			status: 1,
			message: "Order Placed Successfully",
			order_id: addedOrder._id
		});
	});
};

exports.updateOrder = async (req, res) => {
	let OrderDetails = req.body.order_details;
	let PaymentDetails = req.body.payment_details;
	let paramId = "";
	let branchId = "";
	let isChildTableOrders = false;
	let childTableId;
	let fromTableId;
	// Note the below loop will set the parameters based on their roles
	if (req.accessType === "superadmin" || req.accessType === "admin" || req.accessType === 'staffs') {
		if (OrderDetails.table_id) {
			paramId = OrderDetails.table_id;
		} else if (OrderDetails.order_id) {
			paramId = OrderDetails.order_id;
		} else if (OrderDetails.delivery_id) {
			paramId = OrderDetails.delivery_id;
		}
		//super admin scenario
		if (OrderDetails.branch_id) {
			branchId = OrderDetails.branch_id;
			await updateorder().then(() => {
				console.info("Order successfully updated by superadmin");
			});
		} else {
			res.status(404).json({
				status: 0,
				message: "Bad Request"
			});
		}
	} else if (req.accessType === "guest") {
		if (req.tableId) {
			// console.log("tableid");
			paramId = req.tableId;
		} else if (req.orderId) {
			// console.log("orderId");
			// paramId = req.orderId;
			paramId = OrderDetails.order_id;
		} else if (req.deliveryId) {
			paramId = req.deliveryId;
		}
		if (!paramId || !req.branchId) {
			console.error({
				status: 0,
				message: "No proper Access",
				error: "Invalid Access"
			});
			res.status(401).json({
				status: 0,
				message: "No proper Access",
				error: "Invalid Access"
			});
		} else {
			branchId = req.branchId;
			if (req.tableId) {
				let table = await findTable(req.tableId);
				if (table && table.merged_to.length) {
					childTableId = String(req.tableId);
					OrderDetails.table_id = table.merged_to[0].table_id;
					req.tableId = table.merged_to[0].table_id;
					paramId = req.tableId;
					isChildTableOrders = true;
					fromTableId = childTableId;

					await updateorder().then(() => {
						console.info("order successfully updated by guest");
					});
				} else {
					OrderDetails.table_id = req.tableId;
					fromTableId = req.tableId;
					await updateorder().then(() => {
						console.info("order successfully updated by guest");
					});
				}
			} else if (req.orderId) {
				// OrderDetails.order_id = req.orderId;
				OrderDetails.order_id = OrderDetails.order_id;
				await updateorder().then(() => {
					console.info("order successfully updated by guest");
				});
			} else if (req.deliveryId) {
				//NOTE: This function is for future reference , Home delivery by user
				OrderDetails.table_id = req.deliveryId;
				await updateorder().then(() => {
					console.info("order successfully updated by guest");
				});
			}
			// await updateorder().then(() => {
			// 	console.info("order successfully updated by guest");
			// });
		}
	} else {
		console.error({
			status: 0,
			message: "Access denied",
			error: err
		});
		res.status(401).json({
			status: 0,
			message: "Access denied",
			error: "No access to Order"
		});
	}

	async function updateorder() {
		let query;
		if (OrderDetails.table_id) {
			query = { table_id: OrderDetails.table_id };
		} else if (OrderDetails.order_id) {
			query = { order_id: OrderDetails.order_id };
		} else if (OrderDetails.delivery_id) {
			query = { delivery_id: OrderDetails.delivery_id };
		}
	
		// let orderResult = await Order.findOne(query, (err, orderResult) => {
		try {
			const orderResult = await findOrder();
		
			if (!orderResult) {

				// console.log("not orderresult");
				/**
				 * Note: No Order Exists For the table Id
				 * making it as a new Order
				 */
				let billDetails;
				let bill;

				let order_price;
				let sold_item_details = [];
				if ((OrderDetails.order_status === 'placed') || (req.accessType === "guest" && req.tableId)) {
					if (req.accessType === 'guest') {
						await OrderDetails.item_details.forEach(item => {
							item.item_status = "ordered";
							item.from_table_id = fromTableId;
							item.customer_id = req.userId ? req.userId : "";
							item.customer_name = req.userName ? req.userName : "";
						});
					} else {
						await OrderDetails.order_list.item_details.forEach(item => {
							item.item_status = "ordered";
							item.customer_id = req.userId ? req.userId : "";
							item.customer_name = "table order";
						});
					}

					//   OrderDetails.people_in_order = [];
					//   OrderDetails.people_in_order.push({
					//     name: req.userName,
					//     user_id: req.userId
					//   });

					// let selling_prices = OrderDetails.item_details.map(item => {
					//     if (item.applied_addons) {
					//         let temp_price = Number(item.selling_price);
					//         item.applied_addons.forEach(addon => {
					//             temp_price = temp_price + Number(addon.price);
					//         });
					//         return Number(temp_price) * item.quantity;
					//     } else {
					//         let overall_price = item.selling_price * item.quantity;
					//         return Number(overall_price) * item.quantity;
					//     }
					// });

					// order_price = selling_prices.reduce((a, b) => a + b);
					order_price = 0;

					// OrderDetails['total_cost'] = order_price;
					// OrderDetails['final_cost'] = order_price;
				} else if ((OrderDetails.order_status === 'placed') || (req.accessType === "guest" && req.orderId)) {
					//TAKE_AWAY_ORDER
					// CustomerController.findOne({ _id: req.userId }, (err, user) => {
					//     if(err){
					//         console.error({
					//             status: 0,
					//             message: 'Error Finding User',
					//             error: err
					//         });
					//         res.status(404).json({
					//             status: 0,
					//             message: 'Error Finding User',
					//             error: 'User Does not exists in DB'
					//         });
					//     }else{
					//         OrderDetails.item_details.forEach((item) => {
					//             item.item_status = "active";
					//             item.customer_id = req.userId ? req.userId : '';
					//             item.customer_name = req.userName ? req.userName : '';
					//         });
					//     }
					// });
					// TODO: get customer phone number
					if (req.accessType === 'guest') {
						await OrderDetails.item_details.forEach(item => {
							item.item_status = "ordered";
							item.customer_id = req.userId ? req.userId : "";
							item.customer_name = req.userName ? req.userName : "";
						});
					} else {
						await OrderDetails.order_list.item_details.forEach(item => {
							item.item_status = "ordered";
							item.customer_id = req.userId ? req.userId : "";
							item.customer_name = "table order";
						});
					}


					// let isExistingUser = OrderDetails.people_in_order.filter((people) => {
					//   if(people.user_id === req.userId) {
					//     return people;
					//   }
					// });
					// if(isExistingUser.length) {
					//   OrderDetails.people_in_order.push({
					//     name: req.userName,
					//     user_id: req.userId
					//   });
					// }

					/*
					* Below code is use to send the phone number along
					* with their delivery address details 
					* Stuck at using this method asynchronously
					* */
					// Customer.findById(req.userId, (err, customer) => {
					//   if(err) {
					//     console.error({
					//       status: 0,
					//       message: 'error finding customer',
					//       error: 'problem with the server'
					//     })
					//   }else{              
					//     OrderDetails.delivery_address = {
					//       customer_id: req.userId ? req.userId : "",
					//       person_name: req.userName ? req.userName : "",
					//       person_contact : customer.contact_number ? customer.contact_number : null
					//     };
					//   }
					// })
					OrderDetails.delivery_address = {
						customer_id: req.userId ? req.userId : "",
						person_name: req.userName ? req.userName : ""
						// person_contact : "9789882983"
					};
					if (req.accessType == "guest") {
						let current_customer = await Customer.findOne({ _id: req.userId });
						if (current_customer && current_customer.contact_number) {
							OrderDetails.delivery_address.person_contact = current_customer.contact_number;
						}
					}

					if (PaymentDetails && PaymentDetails.id) {
						// let request = PaymentDetails.payment_request;
						// let modified_payment_details = {
						// 	buyers_name: request.buyer_name,
						// 	amount: request.amount,
						// 	purpose: request.purpose,
						// 	payment_id: request.payments[0].payment_id,
						// 	currency: request.payments[0].currency,
						// 	instrument_type: request.payments[0].instrument_type,
						// 	billing_instrument: request.payments[0].billing_instrument,
						// 	paid_out_at: request.payments[0].paid_out_at
						// };

						OrderDetails.payment_details = PaymentDetails;
						OrderDetails.is_order_paid = true;
					}

					// let selling_prices = OrderDetails.item_details.map(item => {
					//     if (item.applied_addons) {
					//         let temp_price = Number(item.selling_price);
					//         item.applied_addons.forEach(addon => {
					//             temp_price = temp_price + Number(addon.price);
					//         });
					//         return Number(temp_price) * item.quantity;
					//     } else {
					//         let overall_price = item.selling_price * item.quantity;
					//         return Number(overall_price) * item.quantity;
					//     }
					// });

					// order_price = selling_prices.reduce((a, b) => a + b);
					order_price = 0;

					// OrderDetails['total_cost'] = order_price;
					// OrderDetails['final_cost'] = order_price;
				} else if ((OrderDetails.order_status !== 'placed') && (req.accessType !== "guest")) {
					await OrderDetails.order_list.item_details.forEach(item => {
						item.item_status = "active";

						sold_item_details.push(
							{ item_id: item.item_id, quantity: item.quantity, name: item.name, category_id: item.category_id }
						);
					}); // //NOTE: This is a temp fix

					OrderDetails.order_list.kot_number = await updateCount(branchId, 'kot');
					OrderDetails.order_list.kot_confirmed_by = req.userId;
					OrderDetails.order_list.order_status = OrderDetails.order_status;
					OrderDetails.has_unassigned_items = true;

					let item_prices = OrderDetails.order_list.item_details.map(item => {
						let overall_price = item.sold_price;
						return Number(overall_price) * item.quantity;
					});

					order_price = item_prices.reduce((a, b) => a + b);
					// console.log(OrderDetails);
					if (OrderDetails.is_applied_service_charge) {
						OrderDetails.service_charge_amount = order_price * (OrderDetails.service_charge_percentage / 100)
					} else {
						OrderDetails.service_charge_amount = 0;
					}


					/**
					 * Find Tax details
					 */
					let item_details_array = [];
					let order_price_after_dicount = order_price; // change this with calculations
					if (OrderDetails.order_list && OrderDetails.order_list.item_details) {
						item_details_array = OrderDetails.order_list.item_details;
						// console.log("if");
					} else if (OrderDetails.order_list && OrderDetails.order_list.length) {
						// console.log("elseif");
						item_details_array = OrderDetails.order_list.map((order) => order.item_details);
					}
					// console.log(item_details_array);
					let all_item_list = item_details_array.flat(Infinity);
					let tax_rates = all_item_list.map((item) => {
						

						if (item.tax_rates) {
							let new_tax_rates = item.tax_rates.filter((tax) => {
								if(item.item_status != 'removed') {
								if (tax.checked == true) {
									tax.item_price = item.sold_price * item.quantity;
									// tax.item_gst_price = (item.sold_price * item.quantity) * (tax.percentage / 100);
									let rounded_tax_rate = ((((item.sold_price / order_price) * (order_price_after_dicount)) * item.quantity) * (tax.percentage / 100));
									tax.item_gst_price = Number(rounded_tax_rate)
									return tax
								} else {
									return false
								}
							}
							})
							return new_tax_rates;
					
					}
					}).filter((x) => x);
					let tax_rates_array = tax_rates.flat(Infinity);
					let order_tax_details = [];
					tax_rates_array.reduce(function (res, value) {
						if (!res[value.tax_type]) {
							res[value.tax_type] = { tax_type: value.tax_type, item_gst_price: 0, tax_percentage: value.percentage };
							order_tax_details.push(res[value.tax_type])
						}
						res[value.tax_type].item_gst_price += value.item_gst_price;
						return res;
					}, {});

					/**
					 * End of finding Tax Details
					 */


					let total_bill_tax_cost = 0;
					if (order_tax_details.length) {
						total_bill_tax_cost = order_tax_details
							.map(tax => {
								return tax.item_gst_price;
							})
							.reduce((a, b) => a + b);
					}

					OrderDetails.order_tax_details = order_tax_details;
					OrderDetails.order_tax_amount = total_bill_tax_cost;

					/** NOTE: The order price is directly placed here 
					 * since there is no possibility
					 * of adding discount to non existing order
					 * */
					OrderDetails.total_cost_after_dicount = order_price;
					OrderDetails.total_after_incl_tax = order_price + total_bill_tax_cost;
				}

				let grouped_sold_items = [];
				sold_item_details.reduce(function (res, value) {
					if (!res[value.item_id]) {
						res[value.item_id] = { item_id: value.item_id, quantity: 0 };
						grouped_sold_items.push(res[value.item_id])
					}
					res[value.item_id].quantity += value.quantity;
					res[value.item_id].name = value.name;
					res[value.item_id].category_id = value.category_id;
					return res;
				}, {});

				if (req.accessType !== 'guest') {
					OrderDetails.order_list.order_status = OrderDetails.order_status
				}

				let order = new Order(OrderDetails);
				let orderList = {};
				order.branch_id = branchId;
				order.table_id = OrderDetails.table_id ? OrderDetails.table_id : null;
				order.order_id = OrderDetails.order_id ? OrderDetails.order_id : null;
				order.delivery_id = OrderDetails.delivery_id ? OrderDetails.delivery_id : null;
				order.total_cost = order_price;
				order.final_cost = order_price;
				//order.order_status = req.accessType === "guest" ? "placed" : "confirmed";   //TODO: Should check this one

				if (OrderDetails.order_status == 'placed' || req.accessType === 'guest') {
					order.order_status = "placed"
				} else {
					order.order_status = "confirmed",
						order.grand_total = OrderDetails.total_after_incl_tax + OrderDetails.service_charge_amount;
				}

				let order_count = await updateCount(branchId, 'order', OrderDetails.order_type)

				order.order_number = order_count.new_order_count;
				order.order_type_number = order_count.new_order_type_count;

				// if(req.accessType !== 'guest') {
				// 	let kot_number = 
				// 	order.kot_number = kot_number;   
				// }

				if (PaymentDetails && PaymentDetails.id) {
					billDetails = {};
					billDetails.branch_id = OrderDetails.branch_id;
					bill = new Bill(billDetails);
					order.bill_id = bill._id;
					// billDetails["company_id"] = req.companyId;
				}

				if (req.accessType === "guest") {
					orderList.order_type = OrderDetails.order_type;
					orderList.order_status = OrderDetails.order_status;
					orderList.item_details = OrderDetails.item_details;
					order.order_list.push(orderList);
				}

				sold_item_details.forEach(async (item) => {
					let item_ingredients = await Recipes.findOne({ item_id: item.item_id });
					if (item_ingredients && item_ingredients.ingredients.length) {
						await item_ingredients.ingredients.forEach(async (ingredient) => {
							let obtained_material = await MaterialStocks.findOne({ material_id: ingredient.material_id });
							let selectedStock = [];
							let item_quantity_to_reduce = item.quantity * ingredient.required_quantity;
							await obtained_material.current_stocks.forEach((array, i) => {
								if (array.available_quantity < item_quantity_to_reduce) {
									item_quantity_to_reduce = item_quantity_to_reduce - array.available_quantity;
									let temp_var = {
										purchase_order_id: array._id
										, purchase_order_number: array.purchase_order_number
										, quantity_before: array.available_quantity
									}
									array.available_quantity = 0;
									temp_var['quantity_after'] = array.available_quantity;
									selectedStock.push(temp_var)
									// obtained_material_quantity = obtained_material.current_stocks.reduce((a, b) => a + b.available_quantity, 0);
								} else if (item_quantity_to_reduce !== 0) {
									let temp_var = {
										purchase_order_id: array._id
										, purchase_order_number: array.purchase_order_number
										, quantity_before: array.available_quantity
									}
									array.available_quantity = array.available_quantity - item_quantity_to_reduce;
									temp_var['quantity_after'] = array.available_quantity;
									selectedStock.push(temp_var);
									item_quantity_to_reduce = 0;
									// obtained_material_quantity = obtained_material.current_stocks.reduce((a, b) => a + b.available_quantity, 0);
								}
							});
							let numberOfIndexToSplice = 0;
							await obtained_material.current_stocks.forEach((array, i) => {
								if (array.available_quantity == 0) {
									numberOfIndexToSplice++;
								}
							})
							obtained_material.current_stocks.splice(0, numberOfIndexToSplice);

							await MaterialStocks.update({ material_id: ingredient.material_id }, { $set: { current_stocks: obtained_material.current_stocks } });
						});
					}
				})

				let savedOrder = await order.save();
				if (OrderDetails.order_status === 'placed' || req.accessType === "guest") {
					if (req.accessType === "guest" && req.tableId) {
						let tableData = {
							branch_id: branchId,
							table_id: paramId,
							floor_id: req.floorId ? req.floorId : undefined,
							order_status: "placed",
							socket_data: "order_placed"
						};

						let lastOrderList = savedOrder.order_list[savedOrder.order_list.length - 1]
						// let lastItemList = [lastOrderList.item_details[lastOrderList.item_details.length - 1]];
						let lastItemList = lastOrderList.item_details;

						let orderData = {
							_id: savedOrder._id,
							order_type: savedOrder.order_type,
							table_id: savedOrder.table_id,
							order_status: "placed",
							message: "order successfully placed",
							item_details: lastItemList
						};

						let table_detail = await Table.findOne({ _id: paramId });

						let child_table_detail;
						if (isChildTableOrders) {
							child_table_detail = await Table.findOne({ _id: childTableId });
						}

						if (!table_detail) {
							console.error({
								status: 0,
								message: "Error finding Table",
								error: "no table found"
							});
							res.status(404).json({
								status: 0,
								message: "Error finding Table",
								error: "no table found"
							});
						} else {

							let duplicateMembers;

							if (isChildTableOrders) {
								duplicateMembers = await child_table_detail.members.filter(member => {
									//NOTE: Converting toString since it is of object type
									return member.toString() === req.userId.toString();
								});
							} else {
								duplicateMembers = await table_detail.members.filter(member => {
									//NOTE: Converting toString since it is of object type
									return member.toString() === req.userId.toString();
								});
							}

							if (isChildTableOrders && !duplicateMembers.length) {
								// Do update child table user count push members to child
								// members if not existing user
								// increase count in parent table if not duplicate user
								// make parent table hasAlert to true

								let childTableDetail = {
									table_members: child_table_detail.table_members
										? child_table_detail.table_members + 1
										: 1,
									total_members: child_table_detail.total_members
										? child_table_detail.total_members + 1
										: 1,
									parent_table: false,
									session_status: "active",
									mobile_order: true
								};

								childTableDetail.members = child_table_detail.members;

								// childTableDetail.members.push({
								// 	// username: req.userName,
								// 	user_id: req.userId
								// });
								childTableDetail.members.push(req.userId);

								//TODO: Change this time, get time from clientside
								if (!child_table_detail.session_started_at) {
									childTableDetail.session_started_at = Date.now();
								}

								let parentTableDetail = {
									total_members: table_detail.total_members
										? table_detail.total_members + 1
										: 1,
									parent_table: true,
									session_status: "active",
									has_alert: true
								};


								table_detail.set(parentTableDetail);
								child_table_detail.set(childTableDetail);
								await child_table_detail.save()
								//TODO need to restrict the returning data
								table_detail.save((err, updatedDetails) => {
									if (err) {
										console.error({
											status: 0,
											message: "Problem Updating Table detail",
											error: err
										});
										res.status(500).json({
											status: 0,
											message: "Problem Updating Table detail",
											error: "Problem with the server"
										});
									} else {
										res.status(201).json({
											status: 1,
											message: "order placed successfully"
										});

										socketController.io.sockets.in(branchId).emit("update_table", tableData);
										socketController.io.sockets.in(branchId).emit("update_order", orderData);
										// ///socketController.io.sockets.in(branchId).emit("update_order_kds", orderData);

										/**
										 * Mobile Socket: Let them know that 
										 */
										socketController.io.sockets.in(paramId).emit("update_table", tableData);

										// PushController.notifyBranchMembers(branchId, {
										// 	message: `New Order from ${updatedDetails.name}.`
										// })
										PushController.notifyZoneMembers(branchId, updatedDetails.floor_id, updatedDetails._id, {
											message: `New Order from ${updatedDetails.name}.`
										})

										PushController.notifyTableMembers(paramId, {
											message: "your order has been updated",
											mobile_data: "order_placed",
											// message: `Your order has been ${savedOrder.status}`,
											mobile_data: "order_placed",
											// mobile_data: `order_${orderDetail.status}`,
											_id: paramId,
											type: savedOrder.order_type
										})
									}
								});



							} else if (isChildTableOrders && duplicateMembers.length) {
								// Handle here
								let updatedPrentTable = await Table.findOneAndUpdate({ _id: paramId }, { $set: { has_alert: true } }, { new: true });

								res.status(201).json({
									status: 1,
									message: "Order added successfully",
									order: savedOrder
								});
								socketController.io.sockets.in(branchId).emit("update_table", tableData); //Notify all B Members table updated
								socketController.io.sockets.in(branchId).emit("update_order", orderData); //Notify all B Members order updated
								///socketController.io.sockets.in(branchId).emit("update_order_kds", orderData);
								/**
								 * Mobile User to kno that table_order has been
								 */
								socketController.io.sockets.in(paramId).emit("update_table", tableData);

								// PushController.notifyBranchMembers(branchId, {
								// 	message: `New Order from ${updatedPrentTable.name}.`
								// })

								PushController.notifyZoneMembers(branchId, table_detail.floor_id, table_detail._id,{
									message: `New Order from ${updatedPrentTable.name}.`
								})

								PushController.notifyTableMembers(paramId, {
									message: "new order on your table",
									mobile_data: "order_placed"
								})
							} else if (!isChildTableOrders && !duplicateMembers.length) {
								let tableDetail = {
									table_members: table_detail.table_members
										? table_detail.table_members + 1
										: 1,
									total_members: table_detail.total_members
										? table_detail.total_members + 1
										: 1,
									parent_table: true,
									session_status: "active",
									mobile_order: true
								};

								tableDetail.members = table_detail.members;

								// tableDetail.members.push({
								// username: req.userName,
								// 	user_id: req.userId
								// });
								tableDetail.members.push(req.userId);

								//TODO: Change this time, get time from clientside
								if (!table_detail.session_started_at) {
									tableDetail.session_started_at = Date.now();
								}

								tableDetail.has_alert = true;

								if (table_detail.table_members === 0) {
									let color = await TableController.getNextColor(table_detail.branch_id);
									tableDetail.table_color = color;
									table_detail.set(tableDetail);

									//TODO need to restrict the returning data
									// await table_detail.save((err, updatedDetails) => {
									let updatedDetails = await table_detail.save();

									res.status(201).json({
										status: 1,
										message: "order placed successfully"
									});

									socketController.io.sockets.in(branchId).emit("update_table", tableData);
									socketController.io.sockets.in(branchId).emit("update_order", orderData);
									///socketController.io.sockets.in(branchId).emit("update_order_kds", orderData);
									/**
									 * Mobile User, let them know that their awaiting order has been confirmed
									 */
									socketController.io.sockets.in(paramId).emit("update_table", tableData);

									// PushController.notifyBranchMembers(branchId, {
									// 	message: `${updatedDetails.name} Occupied`
									// })
									PushController.notifyZoneMembers(branchId, table_detail.floor_id, table_detail._id, {
										message: `${updatedDetails.name} Occupied`
									})
									PushController.notifyTableMembers(paramId, {
										// message: `your order has been placed`,
										message: `Your order has been ${savedOrder.status}`,
										mobile_data: "order_placed",
										// mobile_data: `order_${orderDetail.status}`,
										_id: paramId,
										type: savedOrder.order_type
									})
								} else {
									table_detail.set(tableDetail);
									//TODO need to restrict the returning data
									table_detail.save((err, updatedDetails) => {
										if (err) {
											console.error({
												status: 0,
												message: "Problem Updating Table detail",
												error: err
											});
											res.status(500).json({
												status: 0,
												message: "Problem Updating Table detail",
												error: "Problem with the server"
											});
										} else {
											res.status(201).json({
												status: 1,
												message: "order placed successfully"
											});

											socketController.io.sockets.in(branchId).emit("update_table", tableData);
											socketController.io.sockets.in(branchId).emit("update_order", orderData);
											///socketController.io.sockets.in(branchId).emit("update_order_kds", orderData);
											/**
											 * Mobile Socket: Let them know that 
											 */
											socketController.io.sockets.in(paramId).emit("update_table", tableData);

											// PushController.notifyBranchMembers(branchId, {
											// 	message: `New Order from ${updatedDetails.name}.`
											// })
											PushController.notifyZoneMembers(branchId, table_detail.floor_id, table_detail._id, {
												message: `New Order from ${updatedDetails.name}.`
											})

											PushController.notifyTableMembers(paramId, {
												message: "your order has been updated",
												mobile_data: "order_placed",
												// message: `Your order has been ${savedOrder.status}`,
												mobile_data: "order_placed",
												// mobile_data: `order_${orderDetail.status}`,
												_id: paramId,
												type: savedOrder.order_type
											})
										}
									});
								}
							} else {
								// Handle here
								let updatedTable = await Table.findOneAndUpdate({ _id: paramId }, { $set: { has_alert: true } }, { new: true });

								res.status(201).json({
									status: 1,
									message: "Order added successfully",
									order: savedOrder
								});
								socketController.io.sockets.in(branchId).emit("update_table", tableData); //Notify all B Members table updated
								socketController.io.sockets.in(branchId).emit("update_order", orderData); //Notify all B Members order updated
								///socketController.io.sockets.in(branchId).emit("update_order_kds", orderData);
								/**
								 * Mobile User to kno that table_order has been
								 */
								socketController.io.sockets.in(paramId).emit("update_table", tableData);

								// PushController.notifyBranchMembers(branchId, {
								// 	message: `New Order from ${updatedTable.name}.`
								// })

								PushController.notifyZoneMembers(branchId, table_detail.floor_id, table_detail._id, {
									message: `New Order from ${updatedTable.name}.`
								})

								PushController.notifyTableMembers(paramId, {
									message: "new order on your table",
									mobile_data: "order_placed"
								})
							}
						}
					} else if (req.accessType === "guest" && req.orderId) { //req.OrderId => here represents it is a takeaway order
						let orderData = {
							_id: savedOrder._id,
							order_type: savedOrder.order_type,
							order_id: savedOrder.order_id,
							is_order_paid: savedOrder.is_order_paid ? savedOrder.is_order_paid : false,
							order_status: "placed",
							message: "order successfully placed",
							total_cost: savedOrder.total_cost,
							final_cost: savedOrder.final_cost,
							item_details: OrderDetails.item_details,
							socket_data: 'order_placed'
						};

						if (PaymentDetails && PaymentDetails.id) {
							//TODO: generate bill if it contains payment details;
							// let billDetails = {};
							// // billDetails["company_id"] = req.companyId;

							// let bill = new Bill(billDetails);

							bill["bill_type"] = "total";
							bill["bill_count"] = 1;
							bill["order_id"] = savedOrder._id;
							bill['order_discount'] = savedOrder.order_discount;
							bill['order_offer'] = savedOrder.order_offer;
							bill['branch_id'] = savedOrder.branch_id;
							bill['biller_details'] = {
								"biller_id": req.userId,
								"biller_name": req.userName,
								"initiated_by_customer": true,
								"biller_position": "guest"
							}


							if (savedOrder.table_id) {
								bill['table_id'] = savedOrder.table_id;
							} else if (savedOrder.order_id) {
								bill['takeaway_id'] = savedOrder.order_id;
							}

							let itemBill = [];
							//new code
							savedOrder.order_list.map(order => {
								return order.item_details.forEach(item => {
									let temp_obj = {
										name: item.name,
										selling_price: item.selling_price,
										sold_price: item.sold_price,
										// bill_discount: item.sold_price - orderDiscount,
										bill_discount: item.sold_price,
										quantity: item.quantity,
										addons: []
									};
									if (item.applied_addons.length) {
										item.applied_addons.forEach(addon => {
											let temp_addons = {
												addon_heading: addon.heading,
												addon_name: addon.name,
												addon_price: addon.price,
												addon_type: addon.type,
												addon_quantity: 1
											};
											temp_obj.addons.push(temp_addons);
										});
									}
									itemBill.push(temp_obj);
								});
							});

							bill["bills"] = [];

							let bill_cost = itemBill
								.map(item => {
									return Number(item.bill_discount) * Number(item.quantity);
								})
								.reduce((a, b) => a + b);

							let bill_cost_after_dicount = bill_cost;

							let billData = savedOrder;

							if (billData.order_discount && billData.order_discount.discount_type) {
								if (billData.order_discount.discount_type === "amount") {
									let discount_amount = billData.order_discount.discount_number;
									// let updated_amount = Number(billData.total_cost) - (selectedItemList.item_details[0].sold_price * selectedItemList.item_details[0].quantity);
									// order_price = updated_amount > 0 ? updated_amount - discount_amount : 0;
									bill_cost_after_dicount = bill_cost - discount_amount;
								} else if (billData.order_discount.discount_type === "percentage") {
									// let discount_amount = billData.order_discount.discount_number;
									// let updated_amount = bill_cost - (bill_cost * (billData.order_discount.discount_number/100));
									bill_cost_after_dicount = bill_cost - (bill_cost * (billData.order_discount.discount_number / 100));
									// order_price = updated_amount > 0 ? updated_amount - (discount_amount / 100) * updated_amount : 0;
								} else if (billData.order_discount.discount_type === "new_value") {
									// order_price = billData.order_discount.discount_number;
									bill_cost_after_dicount = billData.order_discount.discount_number;
								} else if (billData.order_discount.discount_type === "flat") {
									// order_price = 0;
									bill_cost_after_dicount = 0;
								}
							}

							/**
							 * Find Tax details
							 */
							let item_details_array = savedOrder.order_list.map((order) => order.item_details);
							let all_item_list = item_details_array.flat(Infinity);
							let tax_rates = all_item_list.map((item) => {
								if(item.item_status != 'removed') {

								let new_tax_rates = item.tax_rates.filter((tax) => {
									if (tax.checked == true) {
										tax.item_price = item.sold_price * item.quantity;
										// tax.item_gst_price = (item.sold_price * item.quantity) * (tax.percentage / 100);
										let rounded_tax_rate = ((((item.sold_price / bill_cost) * (bill_cost_after_dicount)) * item.quantity) * (tax.percentage / 100));
										tax.item_gst_price = Number(rounded_tax_rate);
										return tax
									} else {
										return false
									}
								})
								return new_tax_rates;
							}
							});
							let tax_rates_array = tax_rates.flat(Infinity);
							let bill_taxes_details = [];
							tax_rates_array.reduce(function (res, value) {
								if (!res[value.tax_type]) {
									res[value.tax_type] = { tax_type: value.tax_type, item_gst_price: 0, tax_percentage: value.percentage };
									bill_taxes_details.push(res[value.tax_type])
								}
								res[value.tax_type].item_gst_price += value.item_gst_price;
								return res;
							}, {});
							/**
							 * End of finding Tax Details
							 */



							let total_bill_tax_cost = 0;
							if (bill_taxes_details.length) {
								total_bill_tax_cost = bill_taxes_details
									.map(tax => {
										return tax.item_gst_price;
									})
									.reduce((a, b) => a + b);
							}

							let bill_service_charge = 0;
							if (billData.order_discount && billData.order_discount.discount_type === 'flat') {
								bill_cost = 0;
							}

							for (let i = 0; i < bill["bill_count"]; i++) {
								let structured_bill = {
									bill_status: "billed",
									bill_cost: bill_cost,

									bill_taxes_details: bill_taxes_details,
									bill_tax_amount: total_bill_tax_cost,
									bill_cost_incl_tax: bill_cost + total_bill_tax_cost,
									bill_final_cost: bill_cost + total_bill_tax_cost + bill_service_charge,
									paid_at: Date.now()
								}

								if (bill["table_id"] && billData['service_charge_percentage']) {
									structured_bill['service_charge_percentage'] = billData['service_charge_percentage'];
									structured_bill['service_charge_amount'] = bill_service_charge;
								}
								bill["bills"].push(structured_bill);
							}
							bill["bills"].forEach(bill => {
								bill["item_list"] = itemBill;
							});

							//old code
							// let orderDiscount;
							// if (savedOrder.order_discount && savedOrder.order_discount.discount_type) {
							// 	orderDiscount = savedOrder.order_discount / bill["bill_count"];
							// } else {
							// 	orderDiscount = 0;
							// }

							// await savedOrder.order_list.map(async order => {
							// 	return await order.item_details.forEach(item => {
							// 		let temp_obj = {
							// 			name: item.name,
							// 			selling_price: item.selling_price,
							// 			sold_price: item.sold_price,
							// 			bill_discount: item.sold_price - orderDiscount,
							// 			quantity: item.quantity,
							// 			addons: []
							// 		};
							// 		if (item.applied_addons.length) {
							// 			item.applied_addons.forEach(addon => {
							// 				let temp_addons = {
							// 					addon_heading: addon.heading,
							// 					addon_name: addon.name,
							// 					addon_price: addon.price,
							// 					addon_quantity: 1
							// 				};
							// 				temp_obj.addons.push(temp_addons);
							// 			});
							// 		}
							// 		itemBill.push(temp_obj);
							// 	});
							// });

							// bill["bills"] = [];

							// let bill_cost = await itemBill.map(item => {
							// 	return Number(item.bill_discount) * Number(item.quantity);
							// })
							// 	.reduce((a, b) => a + b);

							// for (let i = 0; i < bill["bill_count"]; i++) {
							// 	bill["bills"].push({
							// 		bill_status: "paid",
							// 		bill_cost: bill_cost,
							// 		paid_at: Date.now()
							// 	});
							// }
							// bill["bills"].forEach(bill => {
							// 	bill["item_list"] = itemBill;
							// });

							let savedBill = await bill.save();

							res.status(201).json({
								status: 1,
								message: "order added successfully",
								order: savedOrder
							});

							socketController.io.sockets.in(branchId).emit("update_order", orderData);
							socketController.io.sockets.in(branchId).emit("update_takeaway", orderData);
							///socketController.io.sockets.in(branchId).emit("update_order_kds", orderData);
							/**
							 * Mobile User Socket for
							 */
							socketController.io.sockets.in(savedOrder._id).emit("update_takeaway", orderData);

							PushController.notifyBranchMembers(branchId, {
								message: `New TakeAway #${savedOrder.order_number}`,
								mobile_data: "order_placed"
							})

							//Not handling response here
							// PushController.notifyOrderMembers(req.orderId, {
							// 	message: "your order placed successfully",
							// 	mobile_data: "order_placed"
							// })
							PushController.notifyOrderMembers(OrderDetails.order_id, {
								message: "your order placed successfully",
								mobile_data: "order_placed"
							})
						} else {
							res.status(201).json({
								status: 1,
								message: "order added successfully",
								order: savedOrder
							});

							socketController.io.sockets.in(branchId).emit("update_order", orderData);
							socketController.io.sockets.in(branchId).emit("update_takeaway", orderData);
							///socketController.io.sockets.in(branchId).emit("update_order_kds", orderData);
							/**
							 * Mobile User update on takeaway placed
							 */
							socketController.io.sockets.in(savedOrder._id).emit("update_takeaway", orderData);

							PushController.notifyBranchMembers(branchId, {
								message: `New TakeAway #${savedOrder.order_number}.`,
								mobile_data: "order_placed"
							})

							//Not handling response here
							// PushController.notifyOrderMembers(req.orderId, {
							// 	message: "your order placed successfully",
							// 	mobile_data: 'order_placed'
							// })
							PushController.notifyOrderMembers(OrderDetails.order_id, {
								message: "your order placed successfully",
								mobile_data: 'order_placed'
							})
						}

						// res.status(201).json({
						//   status: 1,
						//   message: "order added successfully",
						//   order: savedOrder
						// });

						// socketController.io.sockets
						//   .in(branchId)
						//   .emit("update_takeaway", orderData);
						// socketController.io.sockets
						//   .in(branchId)
						//   .emit("update_order", orderData);
						// socketController.io.sockets
						//   .in(savedOrder._id)
						//   .emit("update_takeaway", orderData);

						// PushController.notifyBranchMembers(branchId, {
						//   message: `new takeaway order ${savedOrder.order_id}`,
						//   mobile_data: "order_placed"
						// }).then(result => {
						//   //Not handling response here
						//   PushController.notifyOrderMembers(req.orderId, {
						//     message: "your order placed successfully"
						//   }).then(result => {
						//     //Not handling response here
						//   });
						// });
					} else if (req.accessType !== "guest") {
						let tableData = {
							branch_id: branchId,
							table_id: savedOrder.table_id,
							order_status: "placed",
							socket_data: "order_placed"
						};

						let orderData = {
							_id: savedOrder._id,
							order_type: savedOrder.order_type,
							table_id: savedOrder.table_id,
							order_status: "placed",
							message: "order successfully placed",
							item_details: OrderDetails.item_details
						};

						let table_detail = await Table.findOne({ _id: savedOrder.table_id, });

						if (!table_detail) {
							console.error({
								status: 0,
								message: "Error finding Table",
								error: "no table found"
							});
							res.status(404).json({
								status: 0,
								message: "Error finding Table",
								error: "no table found"
							});
						} else {

							// Handle here
							let updatedTable = await Table.findOneAndUpdate({ _id: paramId }, { $set: { has_alert: true } }, { new: true });

							res.status(201).json({
								status: 1,
								message: "Order added successfully",
								order: savedOrder
							});
							socketController.io.sockets.in(branchId).emit("update_table", tableData); //Notify all B Members table updated
							socketController.io.sockets.in(branchId).emit("update_order", orderData); //Notify all B Members order updated
							///socketController.io.sockets.in(branchId).emit("update_order_kds", orderData);
							/**
							 * Mobile User to kno that table_order has been
							 */
							socketController.io.sockets.in(paramId).emit("update_table", tableData);

							// PushController.notifyBranchMembers(branchId, {
							// 	message: `New Order from ${updatedTable.name}`
							// })

							PushController.notifyZoneMembers(branchId, table_detail.floor_id, table_detail._id , {
								message: `New Order from ${updatedTable.name}`
							})

							PushController.notifyTableMembers(paramId, {
								message: "new order on your table",
								mobile_data: "order_placed"
							})
						}
					} //else if(req.accessType === 'guest' && req.deliveryId) { // FUTURE CONDITION }
				} else if (OrderDetails.order_status !== 'placed') {
					if (OrderDetails.table_id) {
						let updatedTable = await Table.findOneAndUpdate(
							{ _id: OrderDetails.table_id },
							{
								$set: {
									has_alert: false,
									table_amount: order.grand_total ? order.grand_total : order_price,
									total_amount: order.grand_total ? order.grand_total : order_price,
									table_order_status: null
								}
							},
							{ new: true }
						);


						let hasUnassignedItem = false;

						savedOrder.order_list.forEach((order) => {
							return order.item_details.some((item) => {
								if (!item.customer_id) {
									hasUnassignedItem = true;
								}
							})
						});

						let tableData = {
							branch_id: branchId,
							table_id: OrderDetails.table_id,
							floor_id: req.floorId ? req.floorId : undefined,
							item_details: OrderDetails.item_details,
							has_unassigned_item: hasUnassignedItem,
							order_status: "confirmed",
							socket_data: "new_order"
						};

						let orderData = {
							_id: savedOrder._id,
							order_type: savedOrder.order_type,
							table_id: savedOrder.table_id,
							order_status: "confirmed",
							message: "new order in table",
						};

						res.status(201).json({
							status: 1,
							message: "order placed successfully",
							order: savedOrder
						});

						socketController.io.sockets.in(updatedTable.branch_id).emit("update_table", tableData); //Notify all B Members table updated
						socketController.io.sockets.in(updatedTable.branch_id).emit("update_order", orderData); //Notify all B Members order updated
						///socketController.io.sockets.in(branchId).emit("update_order_kds", orderData);
						/**
						 * Mobile User Let them know that new order has been initated and place by the POS manager
						 */
						socketController.io.sockets.in(paramId).emit("update_table", tableData);

						/*
						Removed Notifying branch Members on confirming order
						*/

						//Not handling response here
						PushController.notifyTableMembers(OrderDetails.table_id, {
							message: "new order in your table",
							mobile_data: "order_confirmed"
						})
						updateRecommended(grouped_sold_items);

					} else if (OrderDetails.order_id) {
						let orderData = {
							_id: savedOrder._id,
							order_type: savedOrder.order_type,
							order_id: savedOrder.order_id,
							order_status: "confirmed",
							message: "new takeaway order",
							socket_data: "new_order"
						};

						res.status(201).json({
							status: 1,
							message: "order placed successfully",
							order: savedOrder
						});
						//socketController.io.sockets.in(savedOrder.branch_id).emit("update_order_kds", orderData);
						socketController.io.sockets.in(savedOrder.branch_id).emit("update_order", orderData); //Notify all B Members order updated
						socketController.io.sockets.in(savedOrder.branch_id).emit("update_takeaway", orderData); //Notify all B Members order updated
						/*
						* Mobile User let them know a new order happend from POS Side
						*/
						socketController.io.sockets.in(savedOrder.order_id).emit("update_takeaway", orderData);
						/**
						 * Removed Notifying Branch Members
						 *
						 */
						//   PushController.notifyBranchMembers(branchId, {
						//     message: "new takeaway order"
						//   }).then(result => {
						//Not handling response here
						PushController.notifyOrderMembers(OrderDetails.order_id, {
							message: "new items in your order",
							// mobile_data: "order_confirmed",
							// message: `Your order has been ${orderDetail.status}`, 																
							mobile_data: `takeaway_order_${OrderDetails.status}`,
							_id: OrderDetails.order_id,
							type: OrderDetails.order_type
						})
						updateRecommended(grouped_sold_items);
					} else {
						res.status(201).json({
							status: 1,
							message: "Delivery Order added successfully",
							order: savedOrder
						});

						PushController.notifyBranchMembers(branchId, {
							message: "new delivery order"
						})
					}
				}
			} else {
				// console.log("orderresult");
				let unconfirmedOrders = orderResult.order_list.filter(order => {
					if (order) {
						return order.order_status === "placed";
					}
				});
				if (unconfirmedOrders.length) {
					// console.log("unconfirmedOrders");
					//TODO: Need to update total cost of item
					if (OrderDetails.order_status === 'placed' || req.accessType === "guest") {
						let floorId = req.floorId ? req.floorId : undefined;
						if (req.accessType === "guest") {
							OrderDetails.item_details.forEach(item => {
								item.from_table_id = fromTableId;
								item.item_status = "ordered";
								item.customer_id = req.userId ? req.userId : "";
								item.customer_name = req.userName ? req.userName : "";
							});
						} else {
							OrderDetails.order_list.item_details.forEach(item => {
								item.item_status = "ordered";
								item.customer_id = req.userId ? req.userId : "";
								item.customer_name = "table order";
							});
						}


						// let isExistingUser = OrderDetails.people_in_order.filter((people) => {
						//   if(people.user_id === req.userId) {
						//     return people;
						//   }
						// });
						// if(isExistingUser.length) {
						//   OrderDetails.people_in_order.push({ name: req.userName, user_id: req.userId });
						// }

						let queryOption;
						if (req.accessType === 'guest') {
							queryOption = {
								$push: {
									"order_list.$.item_details": OrderDetails.item_details
								}
							}
						} else {
							if(OrderDetails.delivery_id){
								queryOption = {
									$push: {
										"order_list.$.item_details": OrderDetails.order_list.item_details
									},
									$set:{
										has_alert: false
									}
								}
							}else{
								queryOption = {
									$push: {
										"order_list.$.item_details": OrderDetails.order_list.item_details
									}
								}
							}
						
						}
						Order.findOneAndUpdate(
							{ "order_list._id": unconfirmedOrders[0]._id },
							queryOption,
							{ new: true },
							(err, updatedOrder) => {
								if (err) {
									console.error({
										status: 0,
										message: "Error Updating Order",
										error: err
									});
									res.status(500).json({
										status: 0,
										message: "Error Updating Order",
										error: "Problem with the server"
									});
								} else if (req.tableId) {
									Table.update(
										{ _id: paramId },
										{ $set: { has_alert: true } },
										{ new: true },
										(err, updatedTable) => {
											if (err) {
												console.error({
													status: 0,
													message: "Error Updating Order",
													error: err
												});
												res.status(500).json({
													status: 0,
													message: "Error Updating Order",
													error: "Problem with the server"
												});
											} else {
												let tableData = {
													floor_id: floorId,
													branch_id: branchId,
													// item_details: OrderDetails.item_details,
													table_id: paramId,
													message: "your order has been placed!",
													order_status: "placed",
													socket_data: 'order_placed'
												};

												let lastOrderList = updatedOrder.order_list[updatedOrder.order_list.length - 1]
												// let lastItemList = [lastOrderList.item_details[lastOrderList.item_details.length - 1]];
												let lastItemList = lastOrderList.item_details;

												let orderData = {
													_id: updatedOrder._id,
													order_type: updatedOrder.order_type,
													table_id: updatedOrder.table_id,
													order_status: "placed",
													message: "order successfully placed",
													item_details: lastItemList,
												};

												if (req.accessType === 'guest') {
													let table_orderers = OrderDetails.item_details.map((item) => {
														if (item.customer_id && item.customer_name) {
															return { orderers_name: item.customer_name, orderers_id: item.customer_id }
														}
													});

													// let uniqueUserList = [...new Set(table_orderers.map)];
													// orderData['orderer_details'] = uniqueUserList;


													// const array = [
													// 	{ id: 3, name: 'Central Microscopy', fiscalYear: 2018 },
													// 	{ id: 5, name: 'Crystallography Facility', fiscalYear: 2018 },
													// 	{ id: 3, name: 'Central Microscopy', fiscalYear: 2017 },
													// 	{ id: 5, name: 'Crystallography Facility', fiscalYear: 2017 }
													//   ];
													const result = [];
													const map = new Map();
													for (const item of table_orderers) {
														if (!map.has(item.orderers_id)) {
															map.set(item.orderers_id, true);    // set any value to Map
															result.push({
																orderers_id: item.orderers_id,
																orderers_name: item.orderers_name
															});
														}
													}
													orderData['orderer_details'] = result;
												}

												socketController.io.sockets.in(branchId).emit("update_table", tableData);
												socketController.io.sockets.in(branchId).emit("update_order", orderData);
												///socketController.io.sockets.in(branchId).emit("update_order_kds", orderData);
												// socketController.io.sockets
												//   .in(paramId)
												//   .emit("update_order", tableData);
												socketController.io.sockets.in(paramId).emit("update_table", tableData);

												res.status(201).json({
													status: 1,
													message: "Order added successfully"
												});

												// PushController.notifyBranchMembers(branchId, {
												// 	message: `update in table ${updatedTable.name}`
												// }) 
												// NOTE: The reason for hiding out this is there is no need of notifying user since 
												// it has been already done before incase of having no unconfirmed orders

												PushController.notifyTableMembers(paramId, {
													message: "your order has been updated",
													mobile_data: "order_placed"
												})
											}
										}
									);
								} else if (req.orderId) {
									//TOD: Notify the user
									let orderData = {
										_id: updatedOrder._id,
										order_type: updatedOrder.order_type,
										order_id: updatedOrder.order_id,
										order_status: "placed",
										message: "order successfully placed",
										item_details: OrderDetails.item_details,
										socket_data: 'order_placed'
									};

									socketController.io.sockets.in(branchId).emit("update_order", orderData);
									socketController.io.sockets.in(branchId).emit("update_takeaway", orderData);
									///socketController.io.sockets.in(branchId).emit("update_order_kds", orderData);
									// socketController.io.sockets.in(req.orderId).emit("update_takeaway", orderData);
									socketController.io.sockets.in(OrderDetails.order_id).emit("update_takeaway", orderData);

									res.status(201).json({
										status: 1,
										message: "Order added successfully"
									});

									// NOTE: The resaon for hideout is to not inofrm the user for update in order which was already not confirmed
									// and notified before
									// PushController.notifyBranchMembers(branchId, {
									// 	message: `update in order ${orderResult.order_id}`
									// })

									PushController.notifyOrderMembers(OrderDetails.order_id, {
										message: "your order has been placed",
										mobile_data: "order_placed"
									})
								} else if (req.accessType !== 'guest') {
									Table.update(
										{ _id: updatedOrder.table_id },
										{ $set: { has_alert: true } },
										{ new: true },
										(err, updatedTable) => {
											if (err) {
												console.error({
													status: 0,
													message: "Error Updating Order",
													error: err
												});
												res.status(500).json({
													status: 0,
													message: "Error Updating Order",
													error: "Problem with the server"
												});
											} else {
												let tableData = {
													floor_id: updatedTable.floor_id,
													branch_id: branchId,
													// item_details: OrderDetails.item_details,
													table_id: updatedOrder.table_id,
													message: "your order has been placed!",
													order_status: "placed",
													socket_data: 'order_placed'
												};

												let orderData = {
													_id: updatedOrder._id,
													order_type: updatedOrder.order_type,
													table_id: updatedOrder.table_id,
													order_status: "placed",
													message: "order successfully placed",
													item_details: OrderDetails.item_details,
												};

												socketController.io.sockets.in(branchId).emit("update_table", tableData);
												socketController.io.sockets.in(branchId).emit("update_order", orderData);
												///socketController.io.sockets.in(branchId).emit("update_order_kds", orderData);
												// socketController.io.sockets
												//   .in(paramId)
												//   .emit("update_order", tableData);
												socketController.io.sockets.in(updatedOrder.table_id).emit("update_table", tableData);

												res.status(201).json({
													status: 1,
													message: "Order added successfully"
												});

												// NOTE: the reason for this hideout is to make sure the user not getting frequenet alert for
												// every request, this request has already been informed and notified
												// PushController.notifyBranchMembers(branchId, {
												// 	message: `update in table ${updatedTable.name}`
												// })

												PushController.notifyTableMembers(paramId, {
													message: "your order has been updated",
													mobile_data: "order_placed"
												})
											}
										}
									);
								}
							}
						);
					} else {
					//	console.log("else");
						let inactiveItemCount = 0;
						let sold_item_details = [];
						let hasUnassignedItem = false;

						let selectedFloorId = '';
						if (OrderDetails.table_id) {
							let table = await Table.findOne({ _id: OrderDetails.table_id });
							selectedFloorId = table.floor_id;
						}

						OrderDetails.order_list.item_details.forEach(item => {
							if (!item.customer_id) {
								hasUnassignedItem = true;
							}
							if (item.item_id) {
								item.item_status = "active";
								if (item.assigned_printers && item.assigned_printers.length) {
									let preferedPrinter = item.assigned_printers.find((x) => ((x.floor_id == selectedFloorId) && x.selected));
									item.printer_id = preferedPrinter ? preferedPrinter._id : '';
								}
								sold_item_details.push(
									{ item_id: item.item_id, quantity: item.quantity, name: item.name }
								);

							} else if (!item.item_id && item.item_status === "ordered") {
								inactiveItemCount++;
							}
						}); //NOTE: This is a temp fix

						// Check whether the orderlist contains ordered item with no mobile users
						// let containNoOrdererId;
						// orderResult.order_list.forEach((orderList) => {
						// 	orderList.item_details.forEach((item) => {

						// 	});
						// });

						// let hasUnassignedItem = false;

						// orderResult.order_list.forEach((order) => {
						// 	return order.item_details.some((item) => {
						// 		if (!item.customer_id) {
						// 			hasUnassignedItem = true;
						// 		}
						// 	})
						// })

						if (inactiveItemCount > 0) {
							console.info("contains inactive count");
						} else {
							OrderDetails.order_list.order_status = OrderDetails.order_status;
						}

						let grouped_sold_items = [];
						sold_item_details.reduce(function (res, value) {
							if (!res[value.item_id]) {
								res[value.item_id] = { item_id: value.item_id, quantity: 0 };
								grouped_sold_items.push(res[value.item_id])
							}
							res[value.item_id].quantity += value.quantity;
							res[value.item_id].name = value.name;
							return res;
						}, {});

						let item_prices = OrderDetails.order_list.item_details.map(item => {
							return item.sold_price * item.quantity;
						});

						let new_order_price = item_prices.reduce((a, b) => a + b);

						// let updated_cost;
						let updated_cost = orderResult.total_cost;
						let unconfirmedServices = unconfirmedOrders[0].item_details.filter(item => {
							if (!item.item_id) {
								OrderDetails.order_list.item_details.push(item);
								return item;
							}
						});

						if (orderResult.order_discount && orderResult.order_discount.discount_number) {
							if (orderResult.order_discount.discount_type === "amount") {
								updated_cost = orderResult.total_cost + new_order_price;
							} else if (orderResult.order_discount.discount_type === "percentage") {
								let newPrice = orderResult.total_cost + new_order_price;
								let discountAmount = (orderResult.order_discount.discount_number / 100) * newPrice;
								updated_cost = newPrice - discountAmount;
							} else if (orderResult.order_discount.discount_type === "flat") {
								updated_cost = 0;
							} else if (orderResult.order_discount.discount_type === "new_value") {
								// updated_cost = orderResult.total_cost + new_order_price;
								updated_cost = orderResult.order_discount.discount_number;
							}
						} else {
							updated_cost = orderResult.total_cost + new_order_price;
						}

						sold_item_details.forEach(async (item) => {
							let item_ingredients = await Recipes.findOne({ item_id: item.item_id });
							if (item_ingredients && item_ingredients.ingredients.length) {
								await item_ingredients.ingredients.forEach(async (ingredient) => {
									let obtained_material = await MaterialStocks.findOne({ material_id: ingredient.material_id });
									let selectedStock = [];
									let item_quantity_to_reduce = item.quantity * ingredient.required_quantity;
									await obtained_material.current_stocks.forEach((array, i) => {
										if (array.available_quantity < item_quantity_to_reduce) {
											item_quantity_to_reduce = item_quantity_to_reduce - array.available_quantity;
											let temp_var = {
												purchase_order_id: array._id
												, purchase_order_number: array.purchase_order_number
												, quantity_before: array.available_quantity
											}
											array.available_quantity = 0;
											temp_var['quantity_after'] = array.available_quantity;
											selectedStock.push(temp_var)
											// obtained_material_quantity = obtained_material.current_stocks.reduce((a, b) => a + b.available_quantity, 0);
										} else if (item_quantity_to_reduce !== 0) {
											let temp_var = {
												purchase_order_id: array._id
												, purchase_order_number: array.purchase_order_number
												, quantity_before: array.available_quantity
											}
											array.available_quantity = array.available_quantity - item_quantity_to_reduce;
											temp_var['quantity_after'] = array.available_quantity;
											selectedStock.push(temp_var);
											item_quantity_to_reduce = 0;
											// obtained_material_quantity = obtained_material.current_stocks.reduce((a, b) => a + b.available_quantity, 0);
										}
									});

									let numberOfIndexToSplice = 0;
									await obtained_material.current_stocks.forEach((array, i) => {
										if (array.available_quantity == 0) {
											numberOfIndexToSplice++;
										}
									})
									obtained_material.current_stocks.splice(0, numberOfIndexToSplice);

									await MaterialStocks.update({ material_id: ingredient.material_id }, { $set: { current_stocks: obtained_material.current_stocks } })
								});
							}
						})

						let kot_number = await updateCount(branchId, 'kot');

						let total_cost = orderResult.total_cost + new_order_price;
						let final_cost = Number(updated_cost); // No need to convert to Number if it is of string type



						/**
						 * Order discount calculations
						 */
						let total_cost_after_dicount = total_cost;

						if (orderResult.order_discount && orderResult.order_discount.discount_type) {
							if (orderResult.order_discount.discount_type === "amount") {
								let discount_amount = orderResult.order_discount.discount_number;
								// let updated_amount = Number(orderResult.total_cost) - (selectedItemList.item_details[0].sold_price * selectedItemList.item_details[0].quantity);
								// order_price = updated_amount > 0 ? updated_amount - discount_amount : 0;
								total_cost_after_dicount = total_cost - discount_amount;
							} else if (orderResult.order_discount.discount_type === "percentage") {
								let discount_amount = orderResult.order_discount.discount_number;
								// let updated_amount = total_cost - (total_cost * (orderResult.order_discount.discount_number/100));
								total_cost_after_dicount = total_cost - (total_cost * (orderResult.order_discount.discount_number / 100));
								// order_price = updated_amount > 0 ? updated_amount - (discount_amount / 100) * updated_amount : 0;
							} else if (orderResult.order_discount.discount_type === "new_value") {
								// order_price = orderResult.order_discount.discount_number;
								total_cost_after_dicount = orderResult.order_discount.discount_number;
							} else if (orderResult.order_discount.discount_type === "flat") {
								// order_price = 0;
								total_cost_after_dicount = 0;
							}
						}

						if (orderResult.item_discounts && orderResult.item_discounts.total_discount) {
							total_cost_after_dicount = total_cost_after_dicount - orderResult.item_discounts.total_discount;
						}

						/**
						 * end of order discount calculations
						*/


						let order_price = total_cost;
						/**
						 * Find Tax details
						 */
						let item_details_array;
						let order_price_after_dicount = total_cost_after_dicount; // change this with calculations
						if (OrderDetails.order_list && OrderDetails.order_list.item_details) {
							item_details_array = JSON.parse(JSON.stringify(OrderDetails.order_list.item_details));

							// if(orderResult.order_status != 'placed')  {
							// if(orderResult.final_cost > 0)  {
							orderResult.order_list.forEach((previous_orders) => {
								if (previous_orders.order_status != 'placed') {
									item_details_array.push(previous_orders.item_details)
								}
							});
							// }
						} else if (OrderDetails.order_list && OrderDetails.order_list.length) {
							item_details_array = JSON.parse(JSON.stringify(OrderDetails.order_list)).map((order) => order.item_details);
							orderResult.order_list.forEach((previous_orders) => {
								item_details_array.push(previous_orders.item_details)
							});
						}
						let all_item_list = item_details_array.flat(Infinity);
						let tax_rates = all_item_list.map((item) => {
							if(item.item_status !== 'removed') {
								let new_tax_rates = item.tax_rates.filter((tax) => {
									if (tax.checked == true) {
										tax.item_price = item.sold_price * item.quantity;
										// tax.item_gst_price = (item.sold_price * item.quantity) * (tax.percentage / 100);
										//let rounded_tax_rate = ((item.sold_price * item.quantity) * (tax.percentage / 100)).toFixed(2);
	
										 let rounded_tax_rate = ((((item.sold_price / order_price) * (order_price_after_dicount)) * item.quantity) * (tax.percentage / 100));
										tax.item_gst_price = Number(rounded_tax_rate)
										return tax
									} else {
										return false
									}
								})
								return new_tax_rates;
							}
						}).filter((x) => x);
						let tax_rates_array = tax_rates.flat(Infinity);
						let order_tax_details = [];
						tax_rates_array.reduce(function (res, value) {
							if (!res[value.tax_type]) {
								res[value.tax_type] = { tax_type: value.tax_type, item_gst_price: 0, tax_percentage: value.percentage };
								order_tax_details.push(res[value.tax_type])
							}
							res[value.tax_type].item_gst_price += value.item_gst_price;
							return res;
						}, {});

						/**
						 * End of finding Tax Details
						*/



						let total_bill_tax_cost = 0;
						if (order_tax_details.length) {
							total_bill_tax_cost = order_tax_details
								.map(tax => {
									return tax.item_gst_price;
								})
								.reduce((a, b) => a + b);
						}

						OrderDetails.order_tax_details = order_tax_details;
						OrderDetails.order_tax_amount = total_bill_tax_cost;
						OrderDetails.total_cost_after_dicount = total_cost_after_dicount;

						let setOptions = {
							final_cost: final_cost,
							total_cost: total_cost,
							order_tax_details: order_tax_details,
							order_tax_amount: total_bill_tax_cost,
							total_cost_after_dicount: total_cost_after_dicount,
							total_after_incl_tax: total_cost_after_dicount + total_bill_tax_cost,
							grand_total: total_cost_after_dicount + total_bill_tax_cost,


							order_status: "confirmed", //Used here as a temporary fix
							"order_list.$.order_status": OrderDetails.order_list.order_status,
							"has_unassigned_items": hasUnassignedItem,
							"order_list.$.item_details": OrderDetails.order_list.item_details,
							// "total_cost" : updated_cost ,
							"order_list.$.kot_number": kot_number,
							"order_list.$.kot_confirmed_by": req.userId,
							// total_cost: orderResult.total_cost + new_order_price,
							// final_cost: updated_cost

						}
						if (orderResult.is_applied_service_charge) {
							setOptions.service_charge_amount = total_cost_after_dicount * (orderResult.service_charge_percentage / 100);
							setOptions.grand_total = setOptions.grand_total + setOptions.service_charge_amount
						}
						if(OrderDetails.delivery_id){
							setOptions.has_alert = false
						}




						// if (updateData.item_details && updateData.item_details.length) {
						// 	updateData.item_details.forEach((item) => {
						// 		item.tax_rates.forEach((tax) => {
						// 			if (tax.checked == true) {
						// 				tax.item_price = item.sold_price * item.quantity;
						// 				let rounded_tax_rate = ((item.sold_price * item.quantity) * (tax.percentage / 100)).toFixed(2);
						// 				tax.item_gst_price = Number(rounded_tax_rate)
						// 			}
						// 		})
						// 	});
						// }

						Order.findOneAndUpdate(
							{ "order_list._id": unconfirmedOrders[0]._id },
							{
								$set: setOptions
							},
							{ new: true },
							async (err, updatedOrder) => {
								if (err) {
									console.error({
										status: 0,
										message: "Error Updating Order",
										error: err
									});
									res.status(500).json({
										status: 0,
										message: "Error Updating Order",
										error: "Problem with the server"
									});
								} else {
								//	console.log("updatedOrder");
								//	console.log(updatedOrder);
									if (OrderDetails.table_id) {
										let containsServiceRequest = false;
										let quickService = await QuickService.findOne({ table_id: OrderDetails.table_id });
										if (quickService) {
											quickService.services.forEach((service) => {
												if (service.service_status === 'requested') {
													containsServiceRequest = true;
												}
											})
										}
										Table.findOneAndUpdate(
											{ _id: paramId },
											{
												$set: {
													has_alert: containsServiceRequest,
													// table_amount: updated_cost,
													// total_amount: updated_cost,
													table_amount: setOptions.grand_total,
													total_amount: setOptions.grand_total,
													table_order_status: null
												}
											},
											{ new: true },
											(err, updatedTable) => {
												if (err) {
													console.error({
														status: 0,
														message: "Error Updating Order",
														error: err
													});
													res.status(500).json({
														status: 0,
														message: "Error Updating Order",
														error: "Problem with the server"
													});
												} else {
													let personsInOrder = OrderDetails.order_list.item_details.filter(item => {
														if (item.customer_id) {
															return item.customer_id
														}
													}
													)

													let orderedPersons = [];

													if (personsInOrder.length) {
														orderedPersons = Array.from(new Set(personsInOrder.map(item => {
															if (item.customer_id) {
																return item.customer_id
															}
														}))).map(id => {
															if (id) {
																return {
																	orderer_id: id,
																	orderer_name: personsInOrder.find(s => s.customer_id == id).customer_name
																}
															}
														})
													}

													let tableData;
													if (updatedTable) {
														tableData = {
															floor_id: updatedTable.floor_id,
															branch_id: branchId,
															// item_details: OrderDetails.item_details,
															message: "Your Order has been confirmed!",
															order_status: OrderDetails.order_status
																? OrderDetails.order_status
																: OrderDetails.order_list.order_status,

															table_id: paramId,
															persons_in_order: orderedPersons,
															has_unassigned_item: hasUnassignedItem,
															order_status: "confirmed"
														};
													}

													let orderData = {
														branch_id: branchId,
														table_id: paramId,
														message: "order updated",
														order_status: OrderDetails.order_status
															? OrderDetails.order_status
															: OrderDetails.order_list.order_status
													};

													socketController.io.sockets.in(branchId).emit("update_order", orderData);
													///socketController.io.sockets.in(branchId).emit("update_order_kds", orderData);
													socketController.io.sockets.in(branchId).emit("update_table", tableData);
													socketController.io.sockets.in(paramId).emit("update_table", tableData);

													res.status(201).json({
														status: 1,
														message: "Order added successfully"
													});

													// PushController.notifyBranchMembers(branchId, {
													// 	message: `${updatedTable.name}'s Order was Confirmed.`
													// })
													PushController.notifyZoneMembers(branchId, updatedTable.floor_id, updatedTable._id, {
														message: `${updatedTable.name}'s Order was Confirmed.`
													})

													PushController.notifyTableMembers(paramId, {
														message: "your order is confirmed",
														mobile_data: "order_confirmed"
													})

													updateRecommended(grouped_sold_items);
												}
											}
										);
									} else if (OrderDetails.order_id) {
										let orderData = {
											order_id: paramId,
											message: "order confirmed",
											order_status: OrderDetails.order_status ? OrderDetails.order_status : OrderDetails.order_list.order_status
										};

										socketController.io.sockets.in(branchId).emit("update_order", orderData);
										///socketController.io.sockets.in(branchId).emit("update_order_kds", orderData);
										socketController.io.sockets.in(branchId).emit("update_takeaway", orderData);
										socketController.io.sockets.in(paramId).emit("update_takeaway", orderData);

										res.status(201).json({
											status: 1,
											message: "order updated successfully"
										});
										// socketController.io.sockets.in(branchId).emit('placed_order_update', tableData);
										PushController.notifyBranchMembers(branchId, {
											message: `TakeAway #${OrderDetails.order_id}'s Order was Confirmed.`
										})

										PushController.notifyOrderMembers(paramId, {
											message: "your order is confirmed",
											// mobile_data: "order_confirmed",
											// message: `Your order has been ${orderDetail.status}`, 																
											mobile_data: `takeaway_order_${updatedOrder.order_status}`,
											_id: updatedOrder.order_id,
											type: updatedOrder.order_type
										})

										updateRecommended(grouped_sold_items);
									} else {
										if(updatedOrder.external_order_id)
										{
										const request = require('request');
										request({ url: 'https://pos-int.urbanpiper.com/external/api/v1/orders/'+updatedOrder.external_order_id+'/status/',headers: {'Content-Type': 'application/json','Authorization': 'apikey biz_adm_clients_zSKoOhaHdVkn:36dd26120ee18ba935bc40f1ab1d1dfda4930aba'}, method: 'PUT', json: {"new_status":"Acknowledged","message":"Order Accepted from restaurant"}}, callback);
										function callback(error, response, body) {
											if (!error && response.statusCode == 200) {
											//	console.log(body);
												// res.status(201).json({
												// 	status: 1,
												// 	message: "Order Placed Successfully",
												// 	order_id: addedOrder._id,
												// 	referenceupdate: body
												// });
											
											}
										}
									}
										let deliveryData = {
											delivery_id: paramId,
											message: "Your delivery order has been confirmed",
											order_status: "confirmed"
										};
										// socketController.io.sockets
										// 	.in(branchId)
										// 	.emit("update_delivery", deliveryData);
										// socketController.io.sockets.in(branchId).emit('update_table', deliveryData);
										// socketController.io.sockets.in(paramId).emit('update_table', deliveryData);

										res.status(201).json({
											status: 1,
											message: "Order Updated Successfully"
										});
										// socketController.io.sockets.in(branchId).emit('placed_order_update', tableData);
										PushController.notifyBranchMembers(branchId, {
											message: "Home delivery updated successfully"
										})
									}
								}
							}
						);
					}
				} else {
					// console.log("no unconfirmedOrders");
				if(OrderDetails.placedorder_id ==null){
					// console.log(OrderDetails);
					let updateData;
					let sold_item_details = [];

					if (OrderDetails.order_status === 'placed' || req.accessType === "guest") {
						// console.log("OrderDetails.placedorder_id==null -- placed");
						if (req.accessType === 'guest') {
							OrderDetails.item_details.forEach(item => {
								item.from_table_id = fromTableId;
								item.item_status = "ordered";
								item.customer_id = req.userId ? req.userId : "";
								item.customer_name = req.userName ? req.userName : "";
							}); //NOTE : Temp fix	
						} else {
							OrderDetails.item_details = OrderDetails.order_list.item_details.map(item => {
								item.item_status = "ordered";
								item.customer_id = req.userId ? req.userId : "";
								item.customer_name = "table order";
								return item
							}); //NOTE : Temp fix
						}

						updateData = OrderDetails;
					} else if (OrderDetails.order_status !== 'placed') {
						// console.log("OrderDetails.placedorder_id==null -- not placed");
						let selectedFloorId = '';

						if (OrderDetails.table_id) {
							let table = await Table.findOne({ _id: OrderDetails.table_id });
							selectedFloorId = table.floor_id;
						}

						OrderDetails.order_list.item_details.forEach(item => {
							item.item_status = "active";
							if (item.assigned_printers && item.assigned_printers.length) {
								let preferedPrinter = item.assigned_printers.find((x) => ((x.floor_id == selectedFloorId) && x.selected));
								item.printer_id = preferedPrinter ? preferedPrinter._id : '';
							}

							sold_item_details.push(
								{ item_id: item.item_id, quantity: item.quantity, name: item.name, category_id: item.category_id }
							);
						});

						OrderDetails.order_list.order_status = "confirmed";

						//TODO: check if the order has discount?
						// if no discounts do nothing
						// else if discounts, calculate with the disocunt and the item list
						// update final_cost
						updateData = OrderDetails.order_list;
						updateData._id = new mongoose.Types.ObjectId();
						let kot_number = await updateCount(branchId, 'kot');
						updateData.kot_number = kot_number;
						updateData.kot_confirmed_by = req.userId;
					}

					let grouped_sold_items = [];
					sold_item_details.reduce(function (res, value) {
						if (!res[value.item_id]) {
							res[value.item_id] = { item_id: value.item_id, quantity: 0 };
							grouped_sold_items.push(res[value.item_id])
						}
						res[value.item_id].quantity += value.quantity;
						res[value.item_id].name = value.name;
						res[value.item_id].category_id = value.category_id;
						return res;
					}, {});

					let total_cost = Number(orderResult.total_cost); // Should restrict the user to send Number instead of string typ
					let final_cost = Number(orderResult.final_cost); // No need to convert to Number if it is of string type

					if (OrderDetails.order_status !== 'placed' && req.accessType !== "guest") {
						var itemsProcessed = 0;
						// let sold_item_details = [];
						updateData.item_details.forEach(item => {
							total_cost += item.sold_price * item.quantity;
							// final_cost += (item.sold_price * item.quantity);
							itemsProcessed++;
							if (itemsProcessed === updateData.item_details.length) {
								udpateNewFinalConst();
							}
						});

						function udpateNewFinalConst() {
							if (
								orderResult.order_discount &&
								orderResult.order_discount.discount_number
							) {
								if (orderResult.order_discount.discount_type === "amount") {
									// final_cost = orderResult.total_cost + new_order_price;
									let discountAmount =
										orderResult.order_discount.discount_number;
									final_cost = total_cost - discountAmount;
								} else if (
									orderResult.order_discount.discount_type === "percentage"
								) {
									let discountAmount =
										(orderResult.order_discount.discount_number / 100) *
										total_cost;
									final_cost = total_cost - discountAmount;
								} else if (
									orderResult.order_discount.discount_type === "new_value"
								) {
									// let discountAmount = orderResult.total_cost - orderResult.order_discount.discount_number;
									// final_cost = total_cost - discountAmount;
									final_cost = orderResult.order_discount.discount_number;
								} else if (
									orderResult.order_discount.discount_type === "flat"
								) {
									// final_cost = 0;
									final_cost = 0;
								}
							} else {
								// final_cost = orderResult.total_cost + new_order_price;
								updateData.item_details.forEach(item => {
									final_cost += item.sold_price * item.quantity;
								});
							}
						}
					}

					sold_item_details.forEach(async (item, j) => {
						let item_ingredients = await Recipes.findOne({ item_id: item.item_id });
						if (item_ingredients && item_ingredients.ingredients.length) {
							await item_ingredients.ingredients.forEach(async (ingredient, i) => {
								let obtained_material = await MaterialStocks.findOne({ material_id: ingredient.material_id });
								let selectedStock = [];
								let item_quantity_to_reduce = item.quantity * ingredient.required_quantity;

								await obtained_material.current_stocks.forEach((array, k) => {
									if (array.available_quantity < item_quantity_to_reduce) {
										item_quantity_to_reduce = item_quantity_to_reduce - array.available_quantity;
										let temp_var = {
											purchase_order_id: array._id
											, purchase_order_number: array.purchase_order_number
											, quantity_before: array.available_quantity
										}
										array.available_quantity = 0;
										temp_var['quantity_after'] = array.available_quantity;
										selectedStock.push(temp_var)
										// obtained_material_quantity = obtained_material.current_stocks.reduce((a, b) => a + b.available_quantity, 0);
									} else if (item_quantity_to_reduce !== 0) {
										let temp_var = {
											purchase_order_id: array._id
											, purchase_order_number: array.purchase_order_number
											, quantity_before: array.available_quantity
										}
										array.available_quantity = array.available_quantity - item_quantity_to_reduce;
										temp_var['quantity_after'] = array.available_quantity;
										selectedStock.push(temp_var);
										item_quantity_to_reduce = 0;
										// obtained_material_quantity = obtained_material.current_stocks.reduce((a, b) => a + b.available_quantity, 0);
									}
								});

								let numberOfIndexToSplice = 0;
								await obtained_material.current_stocks.forEach((array, i) => {
									if (array.available_quantity == 0) {
										numberOfIndexToSplice++;
									}
								});
								obtained_material.current_stocks.splice(0, numberOfIndexToSplice);

								await MaterialStocks.update({ material_id: ingredient.material_id }, { $set: { current_stocks: obtained_material.current_stocks } })
							});
						}
					})

					/**
					 * Order discount calculations
					 */
					let total_cost_after_dicount = total_cost;

					if (orderResult.order_discount && orderResult.order_discount.discount_type) {
						if (orderResult.order_discount.discount_type === "amount") {
							let discount_amount = orderResult.order_discount.discount_number;
							// let updated_amount = Number(orderResult.total_cost) - (selectedItemList.item_details[0].sold_price * selectedItemList.item_details[0].quantity);
							// order_price = updated_amount > 0 ? updated_amount - discount_amount : 0;
							total_cost_after_dicount = total_cost - discount_amount;
						} else if (orderResult.order_discount.discount_type === "percentage") {
							let discount_amount = orderResult.order_discount.discount_number;
							// let updated_amount = total_cost - (total_cost * (orderResult.order_discount.discount_number/100));
							total_cost_after_dicount = total_cost - (total_cost * (orderResult.order_discount.discount_number / 100));
							// order_price = updated_amount > 0 ? updated_amount - (discount_amount / 100) * updated_amount : 0;
						} else if (orderResult.order_discount.discount_type === "new_value") {
							// order_price = orderResult.order_discount.discount_number;
							total_cost_after_dicount = orderResult.order_discount.discount_number;
						} else if (orderResult.order_discount.discount_type === "flat") {
							// order_price = 0;
							total_cost_after_dicount = 0;
						}
					}

					if (orderResult.item_discounts && orderResult.item_discounts.total_discount) {
						total_cost_after_dicount = total_cost_after_dicount - orderResult.item_discounts.total_discount;
					}

					/**
					 * end of order discount calculations
					*/


					let order_price = total_cost;
					/**
					 * Find Tax details
					 */
					let item_details_array;
					let order_price_after_dicount = total_cost_after_dicount; // change this with calculations
					if (OrderDetails.order_list && OrderDetails.order_list.item_details) {
						item_details_array = JSON.parse(JSON.stringify(OrderDetails.order_list.item_details));
						orderResult.order_list.forEach((previous_orders) => {
							item_details_array.push(previous_orders.item_details)
						});
					} else if (OrderDetails.order_list && OrderDetails.order_list.length) {
						item_details_array = JSON.parse(JSON.stringify(OrderDetails.order_list)).map((order) => order.item_details);
						orderResult.order_list.forEach((previous_orders) => {
							item_details_array.push(previous_orders.item_details)
						});
					} else if (OrderDetails.item_details && OrderDetails.item_details.length) {
						item_details_array = JSON.parse(JSON.stringify(OrderDetails.item_details)).map((item) => item);
						orderResult.order_list.forEach((previous_orders) => {
							item_details_array.push(previous_orders.item_details)
						});
					}
					let all_item_list = item_details_array.flat(Infinity);
					let tax_rates = all_item_list.map((item) => {
						let new_tax_rates = [];
						if(item.item_status !== 'removed') {
							if (item.tax_rates) {
								new_tax_rates = item.tax_rates.filter((tax) => {
									if (tax.checked == true) {
										let rounded_tax_rate ;
										tax.item_price = item.sold_price * item.quantity;
										// tax.item_gst_price = (item.sold_price * item.quantity) * (tax.percentage / 100);
									//	let rounded_tax_rate = ((item.sold_price * item.quantity) * (tax.percentage / 100)).toFixed(2);
									if (orderResult.order_discount && orderResult.order_discount.discount_type) {
										rounded_tax_rate = ((((item.sold_price / total_cost) * (total_cost_after_dicount)) * item.quantity) * (tax.percentage / 100));
									}else{
										rounded_tax_rate = ((item.sold_price * item.quantity) * (tax.percentage / 100));
									}
										// let rounded_tax_rate = ((((item.sold_price / order_price) * (order_price_after_dicount)) * item.quantity) * (tax.percentage / 100)).toFixed(2);
										tax.item_gst_price = Number(rounded_tax_rate)
										return tax
									} else {
										return false
									}
								})
							}
							return new_tax_rates;
						}
					}).filter((x) => x);
					let tax_rates_array = tax_rates.flat(Infinity);
					let order_tax_details = [];
					tax_rates_array.reduce(function (res, value) {
						if (!res[value.tax_type]) {
							res[value.tax_type] = { tax_type: value.tax_type, item_gst_price: 0, tax_percentage: value.percentage };
							order_tax_details.push(res[value.tax_type])
						}
						res[value.tax_type].item_gst_price += value.item_gst_price;
						return res;
					}, {});

					/**
					 * End of finding Tax Details
					*/


					let total_bill_tax_cost = 0;
					if (order_tax_details.length) {
						total_bill_tax_cost = order_tax_details
							.map(tax => {
								return tax.item_gst_price;
							})
							.reduce((a, b) => a + b);
					}

					OrderDetails.order_tax_details = order_tax_details;
					OrderDetails.order_tax_amount = total_bill_tax_cost;
					OrderDetails.total_cost_after_dicount = total_cost_after_dicount;

					let setOptions;
					if (OrderDetails.order_status !== 'placed' && req.accessType !== "guest") {
						setOptions = {
							final_cost: final_cost,
							total_cost: total_cost,
							order_tax_details: order_tax_details,
							order_tax_amount: total_bill_tax_cost,
							total_cost_after_dicount: total_cost_after_dicount,
							total_after_incl_tax: total_cost_after_dicount + total_bill_tax_cost,
							grand_total: total_cost_after_dicount + total_bill_tax_cost
						}
						if (orderResult.is_applied_service_charge) {
							setOptions.service_charge_amount = total_cost_after_dicount * (orderResult.service_charge_percentage / 100);
							setOptions.grand_total = setOptions.grand_total + setOptions.service_charge_amount
						}
					} else {
						setOptions = {
							final_cost: final_cost,
							total_cost: total_cost,
							// order_tax_details: order_tax_details,
							// order_tax_amount: total_bill_tax_cost,
							// total_cost_after_dicount: total_cost_after_dicount,
							// total_after_incl_tax: total_cost_after_dicount + total_bill_tax_cost,
							// grand_total: total_cost_after_dicount + total_bill_tax_cost
						}
					}

					if (updateData.item_details && updateData.item_details.length) {
						updateData.item_details.forEach((item) => {
						

							if (item.tax_rates) {
								item.tax_rates.forEach((tax) => {
									if(item.item_status != 'removed') {
									if (tax.checked == true) {
										tax.item_price = item.sold_price * item.quantity;
							let rounded_tax_rate = ((((item.sold_price / total_cost) * (total_cost_after_dicount)) * item.quantity) * (tax.percentage / 100));
										//let rounded_tax_rate = ((item.sold_price * item.quantity) * (tax.percentage / 100)).toFixed(2);
										tax.item_gst_price = Number(rounded_tax_rate)
									}
								}
								})
							}
						});
					}

					Order.findOneAndUpdate(
						query,
						{
							$set: setOptions,
							$push: { order_list: updateData }
						},
						{ new: true },
						async (err, updatedOrder) => {
							if (err) {
								console.error({
									status: 0,
									message: "Error updating Order",
									error: err
								});
								res.status(500).json({
									status: 0,
									message: "Error updating Order",
									error: "problem with the server"
								});
							} else {
								if (OrderDetails.order_status === 'placed' || (req.accessType === "guest" && req.tableId)) {
									let containsServiceRequest = false;
									let quickService = await QuickService.findOne({ table_id: OrderDetails.table_id });
									if (quickService) {
										quickService.services.forEach((service) => {
											if (service.service_status === 'requested') {
												containsServiceRequest = true;
											}
										})
									}
									Table.findOneAndUpdate(
										{ _id: updatedOrder.table_id },
										{ $set: { has_alert: true, table_order_status: null } },
										{ new: true },
										(err, updatedTable) => {
											if (err) {
												console.error({
													status: 0,
													message: "Error Updating Order",
													error: err
												});
												res.status(500).json({
													status: 0,
													message: "Error Updating Order",
													error: "Problem with the server"
												});
											} else {
												let tableData = {
													floor_id: updatedTable.floor_id ? updatedTable.floor_id : undefined,
													branch_id: updatedTable.branch_id,
													// item_details: OrderDetails.item_details,
													table_id: updatedOrder.table_id,
													message: "table updated successfully",
													order_status: "placed",
													socket_data: "order_placed"
												};

												let lastOrderList = updatedOrder.order_list[updatedOrder.order_list.length - 1]
												// let lastItemList = [lastOrderList.item_details[lastOrderList.item_details.length - 1]];
												let lastItemList = lastOrderList.item_details;

												let orderData = {
													_id: updatedOrder._id,
													branch_id: updatedTable.branch_id,
													item_details: lastItemList,
													table_id: paramId,
													// item_details: OrderDetails.item_details,
													order_status: "placed",
													message: "order updated successfully"
												};
												// socketController.io.sockets.in(branchId).emit('table_order_mobile', tableData)
												// socketController.io.sockets.in(branchId).emit('placed_order_update', tableData)
												socketController.io.sockets.in(updatedTable.branch_id).emit("update_table", tableData);
												socketController.io.sockets.in(updatedTable.branch_id).emit("update_order", orderData);
												//socketController.io.sockets.in(updatedTable.branch_id).emit("update_order_kds", orderData);
												socketController.io.sockets.in(updatedOrder.table_id).emit("update_table", tableData); //pravin

												res.status(201).json({
													status: 1,
													message: "Order added successfully"
												});

												// PushController.notifyBranchMembers(updatedTable.branch_id, {
												// 	message: `New Order from ${updatedTable.name}.`
												// })

												PushController.notifyZoneMembers(updatedTable.branch_id, updatedTable.floor_id, updatedTable._id, {
													message: `New Order from ${updatedTable.name}.`
												})

												PushController.notifyTableMembers(updatedOrder.table_id, {
													message: "your order has been updated",
													mobile_data: "order_placed",
												})
											}
										}
									);
								} else if (OrderDetails.order_status === 'placed' || (req.accessType === "guest" && req.orderId)) {
									Order.findOneAndUpdate(
										{ order_id: paramId },
										{ $set: { has_alert: true } },
										{ new: true },
										(err, updatedOrder) => {
											if (err) {
												console.error({
													status: 0,
													message: "Error Updating Order",
													error: err
												});
												res.status(500).json({
													status: 0,
													message: "Error Updating Order",
													error: "Problem with the server"
												});
											} else {
												let orderData = {
													_id: updatedOrder._id,
													branch_id: updatedOrder.branch_id,
													item_details: OrderDetails.item_details,
													order_id: updatedOrder.order_id,
													message: "order updated successfully",
													// item_details: OrderDetails.item_details,
													// order_status
													socket_data: "order_placed"
												};

												socketController.io.sockets.in(updatedOrder.branch_id).emit("update_order", orderData);
											//	socketController.io.sockets.in(updatedOrder.branch_id).emit("update_order_kds", orderData);
												socketController.io.sockets.in(updatedOrder.branch_id).emit("update_takeaway", orderData);
												socketController.io.sockets.in(paramId).emit("update_takeaway", orderData);

												res.status(201).json({
													status: 1,
													message: "Order added successfully"
												});

												PushController.notifyBranchMembers(updatedOrder.branch_id, {
													message: `New TakeAway #${updatedOrder.order_number}.`
												})

												PushController.notifyOrderMembers(paramId, {
													message: "your order has been updated",
													// mobile_data: "order_placed",
													// mobile_data: "order_confirmed",
													// message: `Your order has been ${orderDetail.status}`, 																
													mobile_data: `takeaway_order_${updatedOrder.order_status}`,
													_id: updatedOrder.order_id,
													type: updatedOrder.order_type
												});
											}
										}
									);
								} else if (OrderDetails.order_status !== 'placed') {
									if (OrderDetails.table_id) {
										let hasUnassignedItem = false;

										updatedOrder.order_list.forEach((order) => {
											return order.item_details.some((item) => {
												if (!item.customer_id) {
													hasUnassignedItem = true;
												}
											})
										})
										Table.findOneAndUpdate(
											{ _id: paramId },
											{
												$set: {
													has_alert: false,
													table_amount: setOptions.grand_total ? setOptions.grand_total : final_cost,
													total_amount: setOptions.grand_total ? setOptions.grand_total : final_cost,
													table_order_status: null
												}
											},
											{ new: true },
											(err, updatedTable) => {
												if (err) {
													console.error({
														status: 0,
														message: "Error Updating Order",
														error: err
													});
													res.status(500).json({
														status: 0,
														message: "Error Updating Order",
														error: "Problem with the server"
													});
												} else {
													let tableData = {
														floor_id: updatedTable.floor_id
															? updatedTable.floor_id
															: undefined,
														branch_id: branchId,
														// item_details: OrderDetails.item_details,
														table_id: paramId,
														message: "table orders confirmed successfully",
														order_status: "confirmed",
														has_unassigned_item: hasUnassignedItem,
														socket_data: "order_placed"
													};

													let orderData = {
														_id: updatedOrder._id,
														table_id: paramId,
														order_status: OrderDetails.order_status,
														branch_id: branchId,
														item_details: OrderDetails.item_details,
														message: "order confirmed successfully"
													};
													// socketController.io.sockets.in(branchId).emit('table_order_mobile', tableData)
													// socketController.io.sockets.in(branchId).emit('placed_order_update', tableData);
													res.status(201).json({
														status: 1,
														message: "Order added successfully"
													});
													socketController.io.sockets.in(branchId).emit("update_table", tableData);
													socketController.io.sockets.in(branchId).emit("update_order", orderData);
													///socketController.io.sockets.in(branchId).emit("update_order_kds", orderData);
													socketController.io.sockets.in(paramId).emit("update_table", tableData);

													// PushController.notifyBranchMembers(branchId, {
													// 	message: `${updatedTable.name}'s Order was Confirmed.`
													// })
													PushController.notifyZoneMembers(branchId, updatedTable.floor_id, updatedTable._id, {
														message: `${updatedTable.name}'s Order was Confirmed.`
													})

													PushController.notifyTableMembers(paramId, {
														message: "your order confirmed",
														mobile_data: "order_confirmed"
													})

													updateRecommended(grouped_sold_items);
												}
											}
										);
									} else if (OrderDetails.order_id) {
										Order.findOneAndUpdate(
											{ order_id: paramId },
											{ $set: { has_alert: false } },
											{ new: true },
											(err, updatedOrder) => {
												if (err) {
													console.error({
														status: 0,
														message: "Error Updating Order",
														error: err
													});
													res.status(500).json({
														status: 0,
														message: "Error Updating Order",
														error: "Problem with the server"
													});
												} else {
													let orderData = {
														_id: updatedOrder._id,
														branch_id: branchId,
														item_details: OrderDetails.item_details,
														order_id: OrderDetails.order_id,
														message: "order confirmed successfully",
														order_status: OrderDetails.order_status,
														socket_data: "order_placed"
													};

													res.status(201).json({
														status: 1,
														message: "Order updated successfully"
													});
													socketController.io.sockets.in(branchId).emit("update_order", orderData);
													///socketController.io.sockets.in(branchId).emit("update_order_kds", orderData);
													socketController.io.sockets.in(branchId).emit("update_takeaway", orderData);
													socketController.io.sockets.in(paramId).emit("update_takeaway", orderData);

													PushController.notifyBranchMembers(branchId, {
														message: `TakeAway #${updatedOrder.order_name} was Confirmed.`
													})

													PushController.notifyOrderMembers(paramId, {
														message: "your order confirmed",
														// mobile_data: "order_confirmed",
														// mobile_data: "order_placed",
														// mobile_data: "order_confirmed",
														// message: `Your order has been ${orderDetail.status}`, 																
														mobile_data: `takeaway_order_${OrderDetails.order_status}`,
														_id: OrderDetails.order_id,
														type: OrderDetails.order_type
													})

													updateRecommended(grouped_sold_items);
												}
											}
										);
									} else if (OrderDetails.delivery_id) {
										
										res.status(201).json({
											status: 1,
											message: "Order Updated successfully"
										});
									}
								}
							}
						}
					);
				}
			}
		}
		} catch (err) {
			console.error({
				status: 0,
				message: "Error saving Order",
				error: err
			});
			res.status(500).json({
				status: 0,
				message: "Error Saving Order",
				error: "Problem with the server"
			});
		}

		//API: Find if an order already exists in DB
		async function findOrder() {
			try {
				let resultedOrderA = await Order.findOne(query);
				return resultedOrderA;
			} catch (e) {
				console.error('Error finding order =>', e)
			}
		}


	}
	async function findTable(tableId) {
		try {
			let table = await Table.findOne({ _id: tableId })
			return table
		} catch {
			return new Error("no table found")
		}
	}


};

exports.removeOrderDiscount = (req, res) => {
	let orderId = req.params.orderId;

	Order.findOne({ _id: orderId }, (err, orderData) => {
		if (err) {
			console.error({
				status: 0,
				message: "error finding order",
				error: err
			});
			res.status(500).json({
				status: 0,
				message: "error finding order",
				error: "problem with the server"
			});
		} else if (orderData) {
			if (orderData.order_discount && orderData.order_discount.discount_type) {
				let order_cost = 0;
				orderData.order_list.map(list => {
					list.item_details.map(item => {
						if(item.item_status != 'removed') {
						order_cost += item.sold_price * item.quantity;
						}
					});
				});









				/**
				 * Order discount calculations
				 */
				let total_cost_after_dicount = order_cost;
				/**
				 * end of order discount calculations
				*/


				let order_price = order_cost;
				/**
				 * Find Tax details
				 */
				let item_details_array;
				let order_price_after_dicount = total_cost_after_dicount; // change this with calculations
				if (orderData.order_list && orderData.order_list.length) {
					item_details_array = JSON.parse(JSON.stringify(orderData.order_list)).map((order) => order.item_details);
				}
				let all_item_list = item_details_array.flat(Infinity);
				let tax_rates = all_item_list.map((item) => {
					
					
					let new_tax_rates = item.tax_rates.filter((tax) => {
						if(item.item_status != 'removed') {
						if (tax.checked == true) {
							tax.item_price = item.sold_price * item.quantity;
							// tax.item_gst_price = (item.sold_price * item.quantity) * (tax.percentage / 100);
							let rounded_tax_rate = ((((item.sold_price / order_price) * (order_price_after_dicount)) * item.quantity) * (tax.percentage / 100));
							tax.item_gst_price = Number(rounded_tax_rate)
							return tax
						} else {
							return false
						}
					}
					})
					return new_tax_rates;
			
				});
				// console.log(tax_rates);
				let tax_rates_array = tax_rates.flat(Infinity);
				// console.log(tax_rates_array);
				let order_tax_details = [];
				tax_rates_array.reduce(function (res, value) {
				//	// console.log(value);
					if(value != undefined){
				//		// console.log(value);
					if (!res[value.tax_type]) {
						res[value.tax_type] = { tax_type: value.tax_type, item_gst_price: 0, tax_percentage: value.percentage };
						order_tax_details.push(res[value.tax_type])
					}
					res[value.tax_type].item_gst_price += value.item_gst_price;
					return res;
				}
				}, {});

				/**
				 * End of finding Tax Details
				*/



				let total_bill_tax_cost = 0;
				if (order_tax_details.length) {
					total_bill_tax_cost = order_tax_details
						.map(tax => {
							return tax.item_gst_price;
						})
						.reduce((a, b) => a + b);
				}

				orderData.order_tax_details = order_tax_details;
				orderData.order_tax_amount = total_bill_tax_cost;
				orderData.total_cost_after_dicount = total_cost_after_dicount;

				let total_cost_before_discount = order_cost
				if (orderData.item_discounts && orderData.item_discounts.discounted_items.length) {
					total_cost_before_discount = total_cost_after_dicount + orderData.item_discounts['total_discount']
				}

				let setOptions = {
					final_cost: order_cost,
					total_cost: total_cost_before_discount,
					order_tax_details: order_tax_details,
					order_tax_amount: total_bill_tax_cost,
					total_cost_after_dicount: total_cost_after_dicount,
					total_after_incl_tax: total_cost_after_dicount + total_bill_tax_cost,
					grand_total: total_cost_after_dicount + total_bill_tax_cost,
					// final_cost: order_cost,
					"order_discount.discount_type": undefined,
					"order_discount.discount_number": undefined,
					"order_discount.discount_reason": undefined
				}

				if (orderData.is_applied_service_charge) {
					setOptions.service_charge_amount = total_cost_after_dicount * (orderData.service_charge_percentage / 100);
					setOptions.grand_total = setOptions.grand_total + setOptions.service_charge_amount
				}


				let oldSetOptions = {
					final_cost: order_cost,
					"order_discount.discount_type": undefined,
					"order_discount.discount_number": undefined
				}

				Order.findOneAndUpdate(
					{ _id: orderId },
					{
						$set: setOptions
					},
					{ new: true },
					(err, updatedOrder) => {
						if (err) {
							console.error({
								status: 0,
								message: "error removing dicount",
								error: err
							});
							res.status(500).json({
								status: 0,
								message: "error removing dicount",
								error: "problem with the server"
							});
						} else if (updatedOrder) {
							if (orderData.table_id) {
								Table.findOneAndUpdate(
									{ _id: orderData.table_id },
									{
										// $set: { table_amount: order_cost, total_amount: order_cost }
										$set: { table_amount: setOptions.grand_total, total_amount: setOptions.grand_total }
									},
									{ new: true },
									(err, updatedTable) => {
										if (err) {
											console.error({
												status: 0,
												message: "error updating bill on table",
												error: err
											});
											res.status(500).json({
												status: 0,
												message: "error updating bill on table",
												error: "problem with the server"
											});
										} else if (updatedTable) {
											res.status(201).json({
												status: 1,
												message: "discount removed successfully"
											});

											let discountData = {
												discount_action: 'remove',
												discount_for: 'order',
												product_id: orderId,
												order_id: orderId,
												new_price: order_cost
											}

											let tableData = {
												floor_id: updatedTable.floor_id
													? updatedTable.floor_id
													: undefined,
												branch_id: orderData.branch_id,
												table_id: orderData.table_id,
												message: "discount removed successfully",
												order_status: "discount_removed"
											};
											socketController.io.sockets.in(orderData.branch_id).emit("update_order", tableData);
										//	socketController.io.sockets.in(orderData.branch_id).emit("update_order_kds", orderData);


											socketController.io.sockets.in(orderData.table_id).emit("update_discount", discountData);

										} else {
											console.error({
												status: 0,
												message: "error updating bill on table",
												error: err
											});
											res.status(404).json({
												status: 0,
												message: "error updating bill on table",
												error: "no table found"
											});
										}
									}
								);
							} else {
								res.status(201).json({
									status: 1,
									message: "discount removed successfully"
								});
							}
						} else {
							console.error({
								status: 0,
								message: "error removing dicount",
								error: err
							});
							res.status(404).json({
								status: 0,
								message: "error removing dicount",
								error: "item not found"
							});
						}
					}
				);
			} else {
				console.error({
					status: 0,
					message: "no discount found for the order",
					error: err
				});
				res.status(404).json({
					status: 0,
					message: "no discount found for the order",
					error: "no discount applied"
				});
			}
		} else {
			console.error({
				status: 0,
				message: "error finding order",
				error: err
			});
			res.status(404).json({
				status: 0,
				message: "error finding order",
				error: "no order found"
			});
		}
	});
};

exports.updateOrderStatus = (req, res) => {

	let orderDetail = req.body.order_details;
	/**
	 * NOTE: The code used here updates status of the whole order
	 */
	Order.findById(orderDetail._id, (err, order) => {
		if (err) {
			console.error({
				status: 0,
				message: "Error updating Order",
				error: err
			});
			res.status(500).json({
				status: 0,
				message: "Error updating Order",
				error: "Problem with the server"
			});
		} else if (!order) {
			/* Note: This is a dummy condition with no usage */
			console.error({
				status: 0,
				message: "no orders found",
				error: "invalid parameter"
			});
			res.status(404).json({
				status: 0,
				message: "no orders found",
				error: "invalid parameter"
			});
		} else {
			if (orderDetail.status === "confirmed") {
				order.order_list.map(order_detail => {
					let inActiveItems = order_detail.item_details.filter(item => {
						if (item.item_status === "ordered") {
							return item;
						}
					});
					// if (order_detail.order_status === "placed") {
					if (!inActiveItems.length) {
						order_detail.order_status = "confirmed";
					} else {
						console.info("contains inactive items");
					}
					// }
				});
				order.order_status = orderDetail.status;
				// Am just Considering that the first order in the order list by default
				let item_prices = order.order_list[0].item_details.map(item => {
					let overall_price = item.sold_price;
					return Number(overall_price) * item.quantity;
				});

				let order_price = item_prices.reduce((a, b) => a + b);
				order.final_cost = order_price;
				order.total_cost = order_price;
			} else {
				// order.order_status = orderDetail.status;
				orderDetail.order_status = orderDetail.status;
			}

			order.set(orderDetail);
			order.save((err, updatedDetails) => {
				if (err) {
					console.error({
						status: 0,
						message: "Error updating Order",
						error: err
					});
					res.status(500).json({
						status: 0,
						message: "Error updating Order",
						error: "Problem with the server"
					});
				} else {
					let branchId;
					let paramId;
					branchId = orderDetail.branch_id;
					if (req.accessType === "superadmin" || req.accessType === "admin" || req.accessType === 'staffs') {
						if (orderDetail.table_id) {
							paramId = orderDetail.table_id;

							Table.findOne(
								{ _id: orderDetail.table_id },
								(err, resultedTable) => {
									if (err) {
										console.error({
											status: 0,
											message: "error finding table",
											error: err
										});
										res.status(404).json({
											status: 0,
											message: "error finding table",
											error: "problem with the server"
										});
									} else if (resultedTable) {
										res.status(200).json({
											status: 1,
											message: "order removed successfully"
										});
										let tableData = {
											table_id: orderDetail.table_id,
											message: "table updated",
											floor_id: resultedTable.floor_id,
											// order_status: orderDetail.status
											order_status: "confirmed"
										};

										let orderData = {
											_id: updatedDetails._id,
											table_id: orderDetail.table_id,
											order_status: updatedDetails.order_status,
											message: `order ${updatedDetails.order_status
												} successfully`
										};

	
										socketController.io.sockets.in(branchId).emit("update_table", tableData);
										socketController.io.sockets.in(branchId).emit("update_order", orderData);
										///socketController.io.sockets.in(branchId).emit("update_order_kds", orderData);
										socketController.io.sockets.in(paramId).emit("update_table", tableData);
										// PushController.notifyBranchMembers(branchId, {
										// 	message: `${resultedTable.name}'s Order was ${orderDetail.status}`
										// })

										PushController.notifyZoneMembers(branchId, resultedTable.floor_id, resultedTable._id, {
											message: `${resultedTable.name}'s Order was ${orderDetail.status}`
										})

										PushController.notifyTableMembers(paramId, {
											message: `Your order has been ${orderDetail.status}`
										})
									} else {
										console.error({
											status: 0,
											message: "error finding table",
											error: err
										});
										res.status(404).json({
											status: 0,
											message: "error finding table",
											error: "no table found"
										});
									}
								}
							);
						} else if (orderDetail.order_id) {
							paramId = orderDetail.order_id;

							Order.findOne({ order_id: paramId }, (err, resultedOrder) => {
								if (err) {
									console.error({
										status: 0,
										message: "error finding table",
										error: err
									});
									res.status(404).json({
										status: 0,
										message: "error finding table",
										error: "problem with the server"
									});
								} else if (resultedOrder) {
									res.status(200).json({
										status: 1,
										message: "order updated successfully"
									});
									let orderData = {
										_id: updatedDetails._id,
										order_id: orderDetail.order_id,
										order_status: updatedDetails.order_status,
										message: `order ${updatedDetails.order_status} successfully`
									};

									socketController.io.sockets.in(branchId).emit("update_order", orderData);
									///socketController.io.sockets.in(branchId).emit("update_order_kds", orderData);
									socketController.io.sockets.in(branchId).emit("update_takeaway", orderData);
									socketController.io.sockets.in(paramId).emit("update_takeaway", orderData);
									PushController.notifyBranchMembers(branchId,
										{ message: `TakwAway #${resultedOrder.order_number} is ${orderDetail.status}` }
									);

									PushController.notifyOrderMembers(paramId, {
										message: `Your order has been ${orderDetail.status}`,
										mobile_data: `takeaway_order_${orderDetail.status}`,
										_id: paramId,
										type: orderDetail.order_type
									})
								} else {
									console.error({
										status: 0,
										message: "error finding order",
										error: err
									});
									res.status(404).json({
										status: 0,
										message: "error finding order",
										error: "no order found"
									});
								}
							});
						} else {
							let order_Status = "";
							if(orderDetail.status == "confirmed"){
								order_Status = "Acknowledged";
							}else if(orderDetail.status == "prepared")
							{
								order_Status = "Food Ready";
							}
							else if(orderDetail.status == "dispatched")
							{
								order_Status = "Dispatched";
							}else if(orderDetail.status == "delivered")
							{
								order_Status = "Completed";
							}
							if(updatedDetails.external_order_id)
										{
										const request = require('request');
										request({ url: 'https://pos-int.urbanpiper.com/external/api/v1/orders/'+updatedDetails.external_order_id+'/status/',headers: {'Content-Type': 'application/json','Authorization': 'apikey biz_adm_clients_zSKoOhaHdVkn:36dd26120ee18ba935bc40f1ab1d1dfda4930aba'}, method: 'PUT', json: {"new_status":order_Status,"message":"Order "+order_Status+" from restaurant"}}, callback);
										function callback(error, response, body) {
											if (!error && response.statusCode == 200) {
												// console.log(body);
												// res.status(201).json({
												// 	status: 1,
												// 	message: "Order Placed Successfully",
												// 	order_id: addedOrder._id,
												// 	referenceupdate: body
												// });
											
											}
										}
									}
									
							res.status(200).json({
								status: 1,
								message: "order updated successfully"
							});
							paramId = orderDetail.delivery_id;
							// let deliveryData = {
							// 	delivery_id: paramId,
							// 	message: "Your delivery order has been confirmed",
							// 	order_status: orderDetail.status
							// };
							// socketController.io.sockets.in(branchId).emit("update_delivery", deliveryData);
						}
					} else {
						// TODO: Need to pass the branch id in superadmin
						if (orderDetail.table_id) {
							paramId = orderDetail.table_id;

							Table.findOne(
								{ _id: orderDetail.table_id },
								(err, resultedTable) => {
									if (err) {
										console.error({
											status: 0,
											message: "error finding table",
											error: err
										});
										res.status(500).json({
											status: 0,
											message: "error finding table",
											error: "problem with the server"
										});
									} else if (resultedTable) {
										res.status(200).json({
											status: 1,
											message: "order updated successfully"
										});
										let tableData = {
											table_id: orderDetail.table_id,
											message: `table updated successfully`,
											floor_id: resultedTable.floor_id,
											order_status: orderDetail.status
										};

										let orderData = {
											_id: updatedDetails._id,
											table_id: updatedDetails.table_id,
											order_status: updatedDetails.order_status,
											message: `order ${updatedDetails.order_status}`
										};

										socketController.io.sockets.in(branchId).emit("update_table", tableData);
										socketController.io.sockets.in(branchId).emit("update_order", orderData);
										///socketController.io.sockets.in(branchId).emit("update_order_kds", orderData);
										socketController.io.sockets.in(paramId).emit("update_table", tableData);

										// PushController.notifyBranchMembers(branchId, {
										// 	message: `${resultedTable.name}'s Order was ${orderDetail.order_status}.`
										// })

										PushController.notifyZoneMembers(branchId, resultedTable.floor_id, resultedTable._id, {
											message: `${resultedTable.name}'s Order was ${orderDetail.order_status}.`
										})

										PushController.notifyTableMembers(paramId, {
											message: `Your order has been ${orderDetail.status}`
										})

									} else {
										console.error({
											status: 0,
											message: "error finding table",
											error: "no table found"
										});
										res.status(404).error({
											status: 0,
											message: "Error finding table",
											error: "no table found"
										});
									}
								}
							);
						} else if (orderDetail.order_id) {
							paramId = orderDetail.order_id;

							Order.findOne(
								{ order_id: orderDetail.order_id },
								(err, resultedOrder) => {
									if (err) {
										console.error({
											status: 0,
											message: "error updating order",
											error: err
										});
										res.status(500).json({
											status: 0,
											message: "error updating order",
											error: "problem with the server"
										});
									} else if (resultedOrder) {
										res.status(200).json({
											status: 1,
											message: "order updated successfully"
										});
										let orderData = {
											_id: resultedOrder._id,
											order_id: resultedOrder.order_id,
											order_status: resultedOrder.order_status,
											message: `order ${resultedOrder.order_status}`
										};

										socketController.io.sockets.in(branchId).emit("update_order", orderData);
										///socketController.io.sockets.in(branchId).emit("update_order_kds", orderData);
										socketController.io.sockets.in(branchId).emit("update_takeaway", orderData);
										socketController.io.sockets.in(paramId).emit("update_takeaway", orderData);
										PushController.notifyBranchMembers(branchId, {
											message: `TakeAway #${resultedOrder.order_number} was ${orderDetail.status}`
										});
										PushController.notifyOrderMembers(paramId, {
											message: `Your order has been ${orderDetail.status}`,
											mobile_data: `takeaway_order_${orderDetail.status}`,
											_id: paramId,
											type: orderDetail.order_type
										})
									} else {
										console.error({
											status: 0,
											message: "error updating order",
											error: err
										});
										res.status(404).json({
											status: 0,
											message: "error updating order",
											error: "no order found"
										});
									}
								}
							);
						} else {

							paramId = orderDetail.delivery_id;
							// let deliveryData = {
							// 	delivery_id: paramId,
							// 	message: "Your delivery order has been confirmed",
							// 	order_status: orderDetail.status
							// };
							// socketController.io.sockets
							// 	.in(branchId)
							// 	.emit("update_delivery", deliveryData);
						}
					}

					// res.status(200).json({
					//     status: 1,
					//     message: 'Order Updated Successfully'
					// });
					// socketController.io.sockets.in(branchId).emit('placed_order_update', tableData);
					/**
							   * Note: Am considering that only the takeaway orders can update the status and so am directly passing that 
							   * as order_id, the only thing that passes into this function is takeaway order
							  //  */
					// PushController.notifyBranchMembers(branchId, { message: `Order has been ${orderDetail.status}` }).then((result) => {
					//     PushController.notifyOrderMembers(paramId,  { message: `your order has been ${orderDetail.status}`}).then((notifiedResult) => {
					//     });
					// });
				}
			});
		}
	});

	// NOTE: The code here updates the order status of particular kot
	// Order.update(
	//     { "order_list._id": orderBody.order_id },
	//     {
	//         $set: { "order_list.$.order_status": orderBody.status }
	//     }, (err, result) => {
	//         if (err) {
	//             console.error({
	//                 status: 0,
	//                 message: 'Error updating Order status',
	//                 error: err
	//             });
	//             res.status(500).json({
	//                 status: 0,
	//                 message: 'Error updating Order status',
	//                 error: 'problem with the server'
	//             })
	//         } else {
	//             res.status(201).json({
	//                 status: 1,
	//                 message: 'Order Status Updated Successfully'
	//             })
	//         }
	//     })
};

exports.removeServiceCharge = (req, res) => {
	let orderId = req.body.order_id;
	/**
	 * NOTE: The code used here updates status of the whole order
	 */
	Order.findById(orderId, (err, order) => {
		if (err) {
			console.error({
				status: 0,
				message: "Error updating Order",
				error: err
			});
			res.status(500).json({
				status: 0,
				message: "Error updating Order",
				error: "Problem with the server"
			});
		} else if (!order) {
			/* Note: This is a dummy condition with no usage */
			console.error({
				status: 0,
				message: "no orders found",
				error: "invalid parameter"
			});
			res.status(404).json({
				status: 0,
				message: "no orders found",
				error: "invalid parameter"
			});
		} else {
			if (req.accessType === "superadmin" || req.accessType === "admin" || req.accessType === 'staffs') {
				updateServiceCharge()
			} else if (req.accessType === 'guest') {
				CompanyModel.findOne({ _id: req.companyId }, (err, companyResult) => {
					if (err) {
						res.status(500).json({
							status: 0,
							message: "problem with the server",
							error: 'error finding details'
						});
					} else if (!companyResult) {
						res.status(400).json({
							status: 0,
							message: "improper details",
							error: 'error finding details'
						});
					} else {
						if (companyResult.customer_editable_sc) {
							updateServiceCharge()
						} else {
							res.status(401).json({
								status: 0,
								message: "unauthorized access",
								error: 'access denied'
							});
						}
					}
				})
			} else {
				res.status(401).json({
					status: 0,
					message: "Unauthorized Access"
				});
			}

			async function updateServiceCharge() {
				let orderUpdates = {}
				orderUpdates.is_applied_service_charge = false;
				orderUpdates.service_charge_percentage = 0;
				orderUpdates.service_charge_amount = 0;
				orderUpdates.grand_total = order.grand_total - order.service_charge_amount;

				order.set(orderUpdates);
				order.save((err, orderDetail) => {
					if (err) {
						console.error({
							status: 0,
							message: "Error updating Order",
							error: err
						});
						res.status(500).json({
							status: 0,
							message: "Error updating Order",
							error: "Problem with the server"
						});
					} else {
						let branchId;
						let tableId;
						branchId = orderDetail.branch_id;
						if (orderDetail.table_id) {
							tableId = orderDetail.table_id;

							Table.findOneAndUpdate(
								{ _id: tableId },
								{ table_amount: orderDetail.grand_total, total_amount: orderDetail.grand_total },
								{ new: true },
								(err, resultedTable) => {
									if (err) {
										console.error({
											status: 0,
											message: "error finding table",
											error: err
										});
										res.status(404).json({
											status: 0,
											message: "error finding table",
											error: "problem with the server"
										});
									} else if (resultedTable) {
										res.status(200).json({
											status: 1,
											message: "service charge removed successfully"
										});
										let tableData = {
											table_id: orderDetail.table_id,
											message: "service charge removed",
											floor_id: resultedTable.floor_id,
											// order_status: "confirmed",
											socket_data: 'service_charge_removed'
										};

										let orderData = {
											_id: orderDetail._id,
											table_id: orderDetail.table_id,
											// order_status: updatedDetails.order_status,
											order_status: 'service_charge_removed',
											message: `service charge removed successfully`
										};

										socketController.io.sockets.in(branchId).emit("update_table", tableData);
										socketController.io.sockets.in(branchId).emit("update_order", orderData);
										///socketController.io.sockets.in(branchId).emit("update_order_kds", orderData);
										socketController.io.sockets.in(tableId).emit("update_table", tableData);
										// PushController.notifyBranchMembers(branchId, {
										// 	message: `Service charge removed on table ${resultedTable.name}`
										// })
										PushController.notifyZoneMembers(branchId, resultedTable.floor_id, resultedTable._id, {
											message: `Service charge removed on table ${resultedTable.name}`
										})

										PushController.notifyTableMembers(tableId, {
											message: `service charge removed for your order`
										})
									} else {
										console.error({
											status: 0,
											message: "error finding table",
											error: err
										});
										res.status(404).json({
											status: 0,
											message: "error finding table",
											error: "no table found"
										});
									}
								}
							);
						} else {
							res.status(401).json({
								status: 0,
								error: "invalid paramters",
								message: "parameters are not valid"
							});
						}
					}
				});
			}

		}
	});
};
exports.updateOrderKdsStatus = (req,res)=>{
	let orderBody = req.body.order_details;

			let query = { _id: orderBody.order_id };
			let update = {
				$set: {
					"order_list.$[order].order_kds_status": orderBody.status
				}
			};
			let options = {
				arrayFilters: [
					{"order._id":mongoose.Types.ObjectId(orderBody.kot_id)}
				]
			};
			Order.update(query, update, options, function (err, result) {
				if (err) {
					console.error({
						status: 0,
						message: "Error Updating Status",
						error: err
					});
					res.status(500).json({
						status: 0,
						message: "Error Updating Status",
						error: "Problem with the server"
					});
				} else {
					
					//socketController.io.sockets.in(orderBody.branch_id).emit("update_order_kds", orderBody);
					res.status(201).json({
						status: 1,
						message: "Status Updated Successfully"
					});

				}
			});
}
/**
 * Action : this will update item status
 * update order status if all items get served
 */
exports.updateItemStatus = (req, res) => {
	let orderBody = req.body.order_details;
	/**
	 * NOTE: Am using mongoose.Type.ObjectId() method since in database the id's are
	 * stored in mongoose objectId format so to match that am using this function
	 * The Query used here is not an efficient one
	 * Update it with a new simple and efficient Query if possible
	 */
	Order.findById(orderBody.order_id, (err, orderDetails) => {
		if (err) {
			console.error({
				status: 0,
				message: "Error Updating item Status",
				error: err
			});
			res.status(500).json({
				status: 0,
				message: "Error Updating item Status",
				error: "Problem with the server"
			});
		} else {
			console.log('orderDetails>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>',orderDetails);
			console.log('orderDetails>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>',orderDetails.order_list);
			
			let kotLists = orderDetails.order_list;
			let currentOrder = kotLists.filter(kot => {
				if (kot._id.toString() === orderBody.kot_id) {
					return kot;
				}
			})[0]; //this will return the currently selected KOT
			console.log('currentOrder>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>',currentOrder);
			
			let currentOrderStatus = currentOrder.order_status;
			let unservedItems = currentOrder.item_details.filter(item => {
				if (item._id.toString() === orderBody.item_id) {
					item.item_status = orderBody.status;
				}
				if (item.item_status !== "served") {
					return item;
				}
			});

			if (unservedItems.length) {
				let toOrderStatus = "confirmed";
				let query = { _id: orderBody.order_id };
				let update = {
					$set: {
						"order_list.$[].item_details.$[item].item_status": orderBody.status
					}
				};
				let options = {
					arrayFilters: [
						{ "item._id": mongoose.Types.ObjectId(orderBody.item_id) }
					]
				};
				Order.update(query, update, options, function (err, result) {
					if (err) {
						console.error({
							status: 0,
							message: "Error Updating Status",
							error: err
						});
						res.status(500).json({
							status: 0,
							message: "Error Updating Status",
							error: "Problem with the server"
						});
					} else {
						if (currentOrderStatus !== toOrderStatus) {
							let order_query = {
								_id: orderBody.order_id,
								"order_list._id": orderBody.kot_id
							};
							let order_update = {
								$set: { "order_list.$.order_status": toOrderStatus }
							};
							Order.update(order_query, order_update, (err, updatedOrder) => {
								if (err) {
									res.status(404).json({
										status: 0,
										message: "Error updating order status"
									});
								} else {
									let orderData = {
										_id: orderBody.order_id,
										table_id: orderBody.table_id,
										order_status: 'item status changed',
										message: `order updated successfully`
									};
									socketController.io.sockets.in(orderBody.branch_id).emit("update_order", orderData);
								//	socketController.io.sockets.in(orderBody.branch_id).emit("update_order", orderBody);
									socketController.io.sockets.in(orderBody.branch_id).emit("update_order_kds", orderBody);
									res.status(201).json({
										status: 1,
										message: "Status Updated Successfully"
									});
								}
							});
						} else {
							let orderData = {
								_id: orderBody.order_id,
								table_id: orderBody.table_id,
								order_status: 'item status changed',
								message: `order updated successfully`
							};
							socketController.io.sockets.in(orderBody.branch_id).emit("update_order", orderData);
							socketController.io.sockets.in(orderBody.branch_id).emit("update_order_kds", orderBody);
							res.status(201).json({
								status: 1,
								message: "Status Updated Successfully"
							});
						}
					}
				});
			} else {
				let toOrderStatus = "served";
				let query = { _id: orderBody.order_id };
				let update = {
					$set: {
						"order_list.$[].item_details.$[item].item_status": orderBody.status
					}
				};
				let options = {
					arrayFilters: [
						{ "item._id": mongoose.Types.ObjectId(orderBody.item_id) }
					]
				};
				Order.update(query, update, options, function (err, result) {
					if (err) {
						console.error({
							status: 0,
							message: "Error Updating Status",
							error: err
						});
						res.status(500).json({
							status: 0,
							message: "Error Updating Status",
							error: "Problem with the server"
						});
					} else {
						if (currentOrderStatus !== toOrderStatus) {
							let order_query = {
								_id: orderBody.order_id,
								"order_list._id": orderBody.kot_id
							};
							let order_update = {
								$set: { "order_list.$.order_status": toOrderStatus }
							};
							Order.update(order_query, order_update, (err, updatedOrder) => {
								if (err) {
									res.status(404).json({
										status: 0,
										message: "Error on server"
									});
								} else {
									let orderData = {
										_id: orderBody.order_id,
										table_id: orderBody.table_id,
										order_status: 'item status changed',
										message: `order updated successfully`
									};
									socketController.io.sockets.in(orderBody.branch_id).emit("update_order", orderData);
									socketController.io.sockets.in(orderBody.branch_id).emit("update_order_kds", orderBody);
									res.status(201).json({
										status: 1,
										message: "Status Updated Successfully"
									});
								}
							});
						} else {
							let orderData = {
								_id: orderBody.order_id,
								table_id: orderBody.table_id,
								order_status: 'item status changed',
								message: `order updated successfully`
							};
							socketController.io.sockets.in(orderBody.branch_id).emit("update_order", orderData);
							socketController.io.sockets.in(orderBody.branch_id).emit("update_order_kds", orderBody);
							res.status(201).json({
								status: 1,
								message: "Status Updated Successfully"
							});
						}
					}
				});
			}
		}
	});
};

exports.updateItemQuantity = (req, res) => {
	let orderBody = req.body.order_details;
	console.log('orderBody==========',orderBody);
	const query = { _id: orderBody.order_id };
	const update = {
		$set: {
			"order_list.$[].item_details.$[item].quantity": orderBody.quantity,
			"order_list.$[].item_details.$[item].count": orderBody.quantity,
			"order_list.$[].item_details.$[item].delquantity": orderBody.delquantity
		}
	};
	const options = {
		arrayFilters: [{ "item._id": mongoose.Types.ObjectId(orderBody.item_id) }]
	};
	/**
	 * NOTE: Am using mongoose.Type.ObjectId() method since in database the id's are
	 * stored in mongoose objectId format so to match that am using this function
	 */

	Order.updateOne(query, update, options, function (err, result) {
		if (err) {
			console.error({
				status: 0,
				message: "Error updating Order Quantity",
				error: err
			});
			res.status(500).json({
				status: 0,
				message: "Error updating Order Quantity",
				error: "problem with the server"
			});
		}
		if (result.nModified === 1) {
			res.status(201).json({
				status: 1,
				message: "Quantity Updated Successfully"
			});
		} else {
			res.status(401).json({
				status: 0,
				message: "Problem Updating quantity",
				result: result
			});
		}
	});
};

exports.removeItemDiscount = (req, res) => {
	let orderId = req.params.orderId;
	let itemId = req.params.itemId;
	Order.findOne({ _id: orderId }, (err, orderData) => {
		if (err) {
			console.error({
				status: 0,
				message: "error finding order",
				error: err
			});
			res.status(500).json({
				status: 0,
				message: "error finding order",
				error: "problem with the server"
			});
		} else if (orderData) {
			let selectedItem;
			orderData.order_list.map(order_list => {
				order_list.item_details.map(item => {
					if (String(item._id) == itemId) {
						selectedItem = item;
					}
				});
			});
			// console.log("selectedItem");
			// console.log(selectedItem);
			// console.log("orderData");
			// console.log(orderData);
			// TODO: Handle if !selecteditem return no item found

			/** new Update @date 31/07/2020 @by vinopravin*/

			let discountAmount = selectedItem['price_before_discount'] - selectedItem['sold_price']
			let totalAmount = orderData.total_cost_after_dicount;
			let existingOrder = orderData;

			let order_price = totalAmount + discountAmount;

			let total_after_dicount = totalAmount + discountAmount;

			/**
			 * New Codes on adding dicount on orders
			 */

			let existingItemDiscount = existingOrder.item_discounts;
			let existingItemDiscountCost = (existingItemDiscount && existingItemDiscount.total_discount) ? existingItemDiscount.total_discount : 0;
			let existingDiscountedItemCount = (existingItemDiscount && existingItemDiscount.total_items) ? existingItemDiscount.total_items : 0;
			let existingDiscountedItems = (existingItemDiscount && existingItemDiscount.discounted_items) ? existingItemDiscount.discounted_items : [];
			let totalItemDiscountCost = existingItemDiscountCost - discountAmount;

			let isValidDiscount = false;
			existingDiscountedItems = existingDiscountedItems.filter((item) => {
				if (item.item_id == selectedItem._id) {
					isValidDiscount = true;
				} else {
					return item;
				}
			});

			existingDiscountedItemCount = (existingItemDiscount && existingItemDiscount.total_items) ? existingDiscountedItems.length : 0;

			if (!isValidDiscount) {
				res.status(400).json({
					status: 0,
					message: 'Discount not exists',
					error: 'Invalid Parameters'
				});
				return;
			} // return if there is no discount applied for the item


			/**
			* Note: The below code is only used for table orders as for now and will be changed in future for other types of orders too
			*/
			let item_details_array = JSON.parse(JSON.stringify(existingOrder.order_list)).map((order) => order.item_details);
			let all_item_list = item_details_array.flat(Infinity);

			let currentTaxRates = [];
			let tax_rates = all_item_list.map((item, k) => {


				let new_tax_rates = item.tax_rates.filter((tax) => {
					if(item.item_status != 'removed') {
					if (tax.checked == true) {
						if (existingOrder.order_discount && existingOrder.order_discount.discount_number) {

							// console.log("orderdiscount");
							//TODO: There is a discount
							// so include that discount and proceed


							if (item._id == selectedItem['_id']) {
								tax.item_price = selectedItem['price_before_discount'] * item.quantity;
								let temp_var_1 = order_price
								let rounded_tax_rate = ((((selectedItem['price_before_discount'] / totalAmount) * (total_after_dicount)) * item.quantity) * (tax.percentage / 100));

								let revertTax = JSON.parse(JSON.stringify(tax))
								let rounded_tax_rate_2;
								rounded_tax_rate_2 = ((selectedItem['price_before_discount'] * item.quantity) * (tax.percentage / 100));
								revertTax.item_gst_price = Number(rounded_tax_rate_2);
								revertTax.item_price = selectedItem['price_before_discount'] * selectedItem['quantity'];

								tax.item_gst_price = Number(rounded_tax_rate);
								currentTaxRates.push(revertTax)

							} else {
								tax.item_price = item.sold_price * item.quantity;
								let rounded_tax_rate = ((((item.sold_price / totalAmount) * (total_after_dicount)) * item.quantity) * (tax.percentage / 100));
								tax.item_gst_price = Number(rounded_tax_rate)
							}


						} else {
							
							// TODO: Do as you do
							if (item._id == selectedItem['_id']) {
								// console.log("itemdiscount1");
								// update price for the selected item
								tax.item_price = selectedItem['price_before_discount'] * item.quantity;
								let item_sold_price = selectedItem['price_before_discount'];
								// let rounded_tax_rate = (( item_sold_price * item.quantity) * (tax.percentage / 100)).toFixed(2);
								let rounded_tax_rate = ((item_sold_price * item.quantity) * (tax.percentage / 100));
								//let rounded_tax_rate = ((((item_sold_price / totalAmount) * (total_after_dicount)) * item.quantity) * (tax.percentage / 100)).toFixed(2);
								tax.item_gst_price = Number(rounded_tax_rate);
								// console.log(tax.item_gst_price);
								currentTaxRates.push(tax)
							} else {
								// console.log("itemdiscount2");
								tax.item_price = item.sold_price * item.quantity;
								//let rounded_tax_rate = ((((item.sold_price / order_price) * (total_after_dicount)) * item.quantity) * (tax.percentage / 100)).toFixed(2);
								 let rounded_tax_rate = ((((item.sold_price / order_price) * (total_after_dicount)) * item.quantity) * (tax.percentage / 100));
								tax.item_gst_price = Number(rounded_tax_rate)
								// console.log(tax.item_gst_price);
							}
						}

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

			let newSetOptions = {
				"order_list.$[].item_details.$[item].price_before_discount": undefined,
				"order_list.$[].item_details.$[item].discount_detail": {
					_id: selectedItem['discount_detail']._id
				},
				"order_list.$[].item_details.$[item].sold_price": selectedItem.price_before_discount,
				"order_list.$[].item_details.$[item].discount_applied": false,
				'final_cost': orderData.final_cost + ((selectedItem.price_before_discount - selectedItem.sold_price) * selectedItem.quantity),

				'order_list.$[].item_details.$[item].tax_rates': currentTaxRates,
				'total_cost_after_dicount': total_after_dicount,  // new
				'order_tax_details': order_tax_details,
				'order_tax_amount': total_bill_tax_cost,
				'service_charge_amount': service_charge_amount,
				'total_after_incl_tax': total_after_dicount + total_bill_tax_cost,
				'grand_total': total_after_dicount + total_bill_tax_cost + service_charge_amount,
				'item_discounts.total_discount': totalItemDiscountCost,
				'item_discounts.total_items': existingDiscountedItemCount,
				'item_discounts.discounted_items': existingDiscountedItems
			} // working code

			/**
			 * Close of new Code
			 */

			// const query = { '_id': OrderId }
			// const update = { '$set': newSetOptions }; // new code
			// const options = { upsert: true, arrayFilters: [{ 'item._id': mongoose.Types.ObjectId(updateData.item_id) }] };

			/**
			 * NOTE: Am using mongoose.Type.ObjectId() method since in database the id's are
			 * stored in mongoose objectId format so to match that am using this function
			 */


















			/**
				 * New Codes on adding dicount on orders
				 */


			// 	 let existingOrder =  JSON.parse(JSON.stringify(orderData));

			// 	let existingItemDiscount = existingOrder.item_discounts;
			// 	let existingItemDiscountCost = (existingItemDiscount && existingItemDiscount.total_discount) ? existingItemDiscount.total_discount : 0;
			// 	let isValidDiscount = false;
			// 	let existingDiscountedItems = (existingItemDiscount && existingItemDiscount.discounted_items) ? existingItemDiscount.discounted_items : [];  
			// 	existingDiscountedItems = existingDiscountedItems.filter((item) => {
			// 		if(item.item_id == selectedItem._id) {
			// 			isValidDiscount = true;
			// 		} else {
			// 			return item;
			// 		}
			// 	});

			// 	if(!isValidDiscount) {
			//         res.status(400).json({
			//             status: 0,
			//             message: 'Discount not exists',
			//             error: 'Invalid Parameters'
			//         });
			//         return;
			//     } // return if there is no discount applied for the item


			// 	let existingDiscountedItemCount = (existingItemDiscount && existingItemDiscount.total_items) ? existingDiscountedItems.length : 0;  

			// 	let totalItemDiscountCost = existingItemDiscountCost -  (selectedItem['price_before_discount'] - selectedItem['sold_price']);
			// 	let total_after_dicount = orderData.total_cost_after_dicount + (selectedItem['price_before_discount'] - selectedItem['sold_price']);

			//    /**
			//    * Note: The below code is only used for table orders as for now and will be changed in future for other types of orders too
			//    */
			//    let item_details_array = existingOrder.order_list.map((order) => order.item_details);
			//    let all_item_list = item_details_array.flat(Infinity);
			//    let temp_var = 0;
			//    // all_item_list.forEach((item, j) => {
			//    //     temp_var = temp_var + ((item.sold_price / totalAmount) * (total_after_dicount)) * .025;
			//    // });
			//    let currentTaxRates = [];
			//    // = ((Item 1 Cost/Total Cost) * (Cost after Discount)) * Item 1 CGST Tax %) + ((Item 2 Cost/Total Cost) * (Cost after Discount)) * Item 2 CGST Tax %)								
			//    let tax_rates = all_item_list.map((item, k) => {
			// 	   let new_tax_rates = item.tax_rates.filter((tax) => {
			// 		   if (tax.checked == true) {
			// 			   tax.item_price = item.sold_price * item.quantity;

			// 			   let item_sold_price = item.sold_price;
			// 			   if(item._id == selectedItem['_id']) {
			// 				   item_sold_price = selectedItem['price_before_discount'];
			// 				   let revertTax = JSON.parse(JSON.stringify(tax))
			// 				   let rounded_tax_rate;
			// 				   let rounded_tax_rate_2;

			// 				   rounded_tax_rate = (((( item_sold_price / existingOrder.total_cost) * (total_after_dicount)) * item.quantity) * (tax.percentage / 100)).toFixed(2);
			// 				   rounded_tax_rate_2 = (( item_sold_price * item.quantity) * (tax.percentage / 100)).toFixed(2);

			// 				   revertTax.item_gst_price = Number(rounded_tax_rate_2);
			// 				   revertTax.item_price =  selectedItem['price_before_discount'] * selectedItem['quantity'];


			// 					tax.item_gst_price = Number(rounded_tax_rate);
			// 				   currentTaxRates.push(revertTax)
			// 			   } else {
			// 					let rounded_tax_rate;
			// 					rounded_tax_rate = ((((item.sold_price / existingOrder.total_cost) * (total_after_dicount)) * item.quantity) * (tax.percentage / 100)).toFixed(2);
			// 					tax.item_gst_price = Number(rounded_tax_rate);
			// 				}
			// 			   return tax
			// 		   } else {
			// 			   return false
			// 		   }
			// 	   })
			// 	   return new_tax_rates;
			//    });
			//    // = ((Item 1 Cost/Total Cost) * (Cost after Discount)) * Item 1 CGST Tax %) + ((Item 2 Cost/Total Cost) * (Cost after Discount)) * Item 2 CGST Tax %)								
			//    let tax_rates_array = tax_rates.flat(Infinity);
			//    let result2 = [];
			//    tax_rates_array.reduce(function (res, value) {
			// 	   if (!res[value.tax_type]) {
			// 		   // res[value.name] = { name: value.name, item_gst_price: 0,  tax_percentage: value.value };
			// 		   res[value.tax_type] = { tax_type: value.tax_type, item_gst_price: 0, tax_percentage: value.percentage };
			// 		   result2.push(res[value.tax_type])
			// 	   }
			// 	   res[value.tax_type].item_gst_price += value.item_gst_price;
			// 	   return res;
			//    }, {});

			//    let order_tax_details = result2;

			//    let total_bill_tax_cost = 0;
			//    if (order_tax_details.length) {
			// 	   total_bill_tax_cost = order_tax_details
			// 		   .map(tax => {
			// 			   return tax.item_gst_price;
			// 		   })
			// 		   .reduce((a, b) => a + b);
			//    }

			//    let service_charge_amount = 0;

			//    if (existingOrder.is_applied_service_charge) {
			// 	   service_charge_amount = ((total_after_dicount) * (existingOrder.service_charge_percentage / 100))
			//    }

			//    let newSetOptions = {
			// 	   "order_list.$[].item_details.$[item].price_before_discount": undefined,
			// 		"order_list.$[].item_details.$[item].discount_detail": {
			// 			_id: selectedItem['discount_detail']._id
			// 		},
			// 		"order_list.$[].item_details.$[item].sold_price": selectedItem.price_before_discount,
			// 		"order_list.$[].item_details.$[item].discount_applied": false,
			// 		'final_cost': orderData.final_cost + ((selectedItem.price_before_discount - selectedItem.sold_price) * selectedItem.quantity),




			// 	   'order_list.$[].item_details.$[item].tax_rates': currentTaxRates,
			// 	   'total_cost_after_dicount': total_after_dicount,  // new
			// 	   'order_tax_details': order_tax_details,
			// 	   'order_tax_amount': total_bill_tax_cost,
			// 	   'service_charge_amount': service_charge_amount,
			// 	   'total_after_incl_tax': total_after_dicount + total_bill_tax_cost,
			// 	   'grand_total': total_after_dicount + total_bill_tax_cost + service_charge_amount,
			// 	   'item_discounts.total_discount': totalItemDiscountCost, 
			// 	   'item_discounts.total_items': existingDiscountedItemCount,
			// 	   'item_discounts.discounted_items': existingDiscountedItems
			//    } // working code

			/**
			 * Close of new Code
			 */































			let query = { _id: orderId };
			let update = {
				$set: newSetOptions
			};
			let options = {
				arrayFilters: [{ "item._id": mongoose.Types.ObjectId(itemId) }],
				new: true
			};
			let order_cost = orderData.final_cost + ((selectedItem.price_before_discount - selectedItem.sold_price) * selectedItem.quantity);

			Order.findOneAndUpdate(query, update, options, (err, updatedOrder) => {
				if (err) {
					console.error({
						status: 0,
						message: "error removing discount",
						error: err
					});
					res.status(500).json({
						status: 0,
						message: "error removing discount",
						error: "problem with the server"
					});
				} else if (updatedOrder) {
					if (orderData.table_id) {
						Table.findOneAndUpdate(
							{ _id: orderData.table_id },
							// { $set: { table_amount: order_cost, total_amount: order_cost } },
							{ $set: { table_amount: newSetOptions.grand_total, total_amount: newSetOptions.grand_total } },
							{ new: true },
							(err, updatedTable) => {
								if (err) {
									console.error({
										status: 0,
										message: "error updating bill on table",
										error: err
									});
									res.status(500).json({
										status: 0,
										message: "error updating bill on table",
										error: "problem with the server"
									});
								} else if (updatedTable) {
									res.status(201).json({
										status: 1,
										message: "discount removed successfully"
									});

									let discountData = {
										discount_action: 'remove',
										discount_for: 'item',
										product_id: itemId,
										order_id: orderId,
										new_price: selectedItem.price_before_discount
									}

									let tableData = {
										floor_id: updatedTable.floor_id
											? updatedTable.floor_id
											: undefined,
										branch_id: orderData.branch_id,
										table_id: orderData.table_id,
										message: "discount removed successfully",
										order_status: "discount_removed"
									};
									socketController.io.sockets.in(orderData.branch_id).emit("update_order", tableData);

									socketController.io.sockets.in(orderData.table_id).emit("update_discount", discountData);

								} else {
									console.error({
										status: 0,
										message: "error updating bill on table",
										error: err
									});
									res.status(404).json({
										status: 0,
										message: "error updating bill on table",
										error: "no table found"
									});
								}
							}
						);
					} else {
						res.status(201).json({
							status: 1,
							message: "discount removed successfully"
						});
					}
				} else {
					console.error({
						status: 0,
						message: "error removing discount",
						error: err
					});
					res.status(404).json({
						status: 0,
						message: "error removing discount",
						error: "no order found"
					});
				}
			});
		} else {
			console.error({
				status: 0,
				message: "error finding order",
				error: err
			});
			res.status(404).json({
				status: 0,
				message: "error finding order",
				error: "no order found"
			});
		}
	});
};


exports.removeItemDiscountBkp = (req, res) => {
	let orderId = req.params.orderId;
	let itemId = req.params.itemId;
	Order.findOne({ _id: orderId }, (err, orderData) => {
		if (err) {
			console.error({
				status: 0,
				message: "error finding order",
				error: err
			});
			res.status(500).json({
				status: 0,
				message: "error finding order",
				error: "problem with the server"
			});
		} else if (orderData) {
			let selectedItem;
			orderData.order_list.map(order_list => {
				order_list.item_details.map(item => {
					if (String(item._id) == itemId) {
						selectedItem = item;
					}
				});
			});



			/**
				 * New Codes on adding dicount on orders
				 */


			let existingOrder = JSON.parse(JSON.stringify(orderData));

			let existingItemDiscount = existingOrder.item_discounts;
			let existingItemDiscountCost = (existingItemDiscount && existingItemDiscount.total_discount) ? existingItemDiscount.total_discount : 0;
			let isValidDiscount = false;
			let existingDiscountedItems = (existingItemDiscount && existingItemDiscount.discounted_items) ? existingItemDiscount.discounted_items : [];
			existingDiscountedItems = existingDiscountedItems.filter((item) => {
				if (item.item_id == selectedItem._id) {
					isValidDiscount = true;
				} else {
					return item;
				}
			});

			if (!isValidDiscount) {
				res.status(400).json({
					status: 0,
					message: 'Discount not exists',
					error: 'Invalid Parameters'
				});
				return;
			} // return if there is no discount applied for the item


			let existingDiscountedItemCount = (existingItemDiscount && existingItemDiscount.total_items) ? existingDiscountedItems.length : 0;

			let totalItemDiscountCost = existingItemDiscountCost - (selectedItem['price_before_discount'] - selectedItem['sold_price']);
			let total_after_dicount = orderData.total_cost_after_dicount + (selectedItem['price_before_discount'] - selectedItem['sold_price']);

			let oldSetOptions = {
				"order_list.$[].item_details.$[item].price_before_discount": undefined,
				"order_list.$[].item_details.$[item].sold_price": selectedItem.price_before_discount,
				"order_list.$[].item_details.$[item].discount_applied": false,
				final_cost: orderData.final_cost + ((selectedItem.price_before_discount - selectedItem.sold_price) * selectedItem.quantity)
			} // backup code


			/**
			* Note: The below code is only used for table orders as for now and will be changed in future for other types of orders too
			*/
			let item_details_array = existingOrder.order_list.map((order) => order.item_details);
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
						if (item._id == selectedItem['_id']) {
							item_sold_price = selectedItem['price_before_discount'];
							let revertTax = JSON.parse(JSON.stringify(tax))
							let rounded_tax_rate;
							let rounded_tax_rate_2;
							rounded_tax_rate = ((((item_sold_price / existingOrder.total_cost) * (total_after_dicount)) * item.quantity) * (tax.percentage / 100));
							rounded_tax_rate_2 = ((item_sold_price * item.quantity) * (tax.percentage / 100));

							revertTax.item_gst_price = Number(rounded_tax_rate_2);
							revertTax.item_price = selectedItem['price_before_discount'] * selectedItem['quantity'];


							tax.item_gst_price = Number(rounded_tax_rate);
							// tax.item_price =  selectedItem['price_before_discount'] * selectedItem['quantity'];


							//    tax.item_gst_price = Number(rounded_tax_rate);
							//    tax.item_price =  selectedItem['price_before_discount'] * selectedItem['quantity'];
							currentTaxRates.push(revertTax)
						} else {
							let rounded_tax_rate;
							rounded_tax_rate = ((((item.sold_price / existingOrder.total_cost) * (total_after_dicount)) * item.quantity) * (tax.percentage / 100));
							tax.item_gst_price = Number(rounded_tax_rate);
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

			let newSetOptions = {
				//    'order_list.$[].item_details.$[item].discount_detail': updateData,
				//    'order_list.$[].item_details.$[item].sold_price': newAmount,
				//    'order_list.$[].item_details.$[item].price_before_discount': updateData['old_price'],
				//    'order_list.$[].item_details.$[item].discount_applied': 1,
				//    'final_cost': order_price,

				"order_list.$[].item_details.$[item].price_before_discount": undefined,
				"order_list.$[].item_details.$[item].discount_detail": {
					_id: selectedItem['discount_detail']._id
				},
				"order_list.$[].item_details.$[item].sold_price": selectedItem.price_before_discount,
				"order_list.$[].item_details.$[item].discount_applied": false,
				'final_cost': orderData.final_cost + ((selectedItem.price_before_discount - selectedItem.sold_price) * selectedItem.quantity),




				'order_list.$[].item_details.$[item].tax_rates': currentTaxRates,
				'total_cost_after_dicount': total_after_dicount,  // new
				'order_tax_details': order_tax_details,
				'order_tax_amount': total_bill_tax_cost,
				'service_charge_amount': service_charge_amount,
				'total_after_incl_tax': total_after_dicount + total_bill_tax_cost,
				'grand_total': total_after_dicount + total_bill_tax_cost + service_charge_amount,
				'item_discounts.total_discount': totalItemDiscountCost,
				'item_discounts.total_items': existingDiscountedItemCount,
				'item_discounts.discounted_items': existingDiscountedItems
			} // working code

			/**
			 * Close of new Code
			 */































			let query = { _id: orderId };
			let update = {
				$set: newSetOptions
			};
			let options = {
				arrayFilters: [{ "item._id": mongoose.Types.ObjectId(itemId) }],
				new: true
			};
			let order_cost = orderData.final_cost + ((selectedItem.price_before_discount - selectedItem.sold_price) * selectedItem.quantity);

			Order.findOneAndUpdate(query, update, options, (err, updatedOrder) => {
				if (err) {
					console.error({
						status: 0,
						message: "error removing discount",
						error: err
					});
					res.status(500).json({
						status: 0,
						message: "error removing discount",
						error: "problem with the server"
					});
				} else if (updatedOrder) {
					if (orderData.table_id) {
						Table.findOneAndUpdate(
							{ _id: orderData.table_id },
							// { $set: { table_amount: order_cost, total_amount: order_cost } },
							{ $set: { table_amount: newSetOptions.grand_total, total_amount: newSetOptions.grand_total } },
							{ new: true },
							(err, updatedTable) => {
								if (err) {
									console.error({
										status: 0,
										message: "error updating bill on table",
										error: err
									});
									res.status(500).json({
										status: 0,
										message: "error updating bill on table",
										error: "problem with the server"
									});
								} else if (updatedTable) {
									res.status(201).json({
										status: 1,
										message: "discount removed successfully"
									});

									let discountData = {
										discount_action: 'remove',
										discount_for: 'item',
										product_id: itemId,
										order_id: orderId,
										new_price: selectedItem.price_before_discount
									}

									socketController.io.sockets.in(orderData.table_id).emit("update_discount", discountData);

								} else {
									console.error({
										status: 0,
										message: "error updating bill on table",
										error: err
									});
									res.status(404).json({
										status: 0,
										message: "error updating bill on table",
										error: "no table found"
									});
								}
							}
						);
					} else {
						res.status(201).json({
							status: 1,
							message: "discount removed successfully"
						});
					}
				} else {
					console.error({
						status: 0,
						message: "error removing discount",
						error: err
					});
					res.status(404).json({
						status: 0,
						message: "error removing discount",
						error: "no order found"
					});
				}
			});
		} else {
			console.error({
				status: 0,
				message: "error finding order",
				error: err
			});
			res.status(404).json({
				status: 0,
				message: "error finding order",
				error: "no order found"
			});
		}
	});
};

/**
 * Updated on 09/03/2021
 */
exports.removeItem = async (req, res) => {
	let orderBody = req.body.order_details;
	let isItemConfirmed = true;
	let reason = '';
	let status = 'removed'
	/**
	 * NOTE: Am using mongoose.Type.ObjectId() method since in database the id's are
	 * stored in mongoose objectId format so to match that am using this function
	 * The Query used here is not an efficient one
	 * Update it with a new simple and efficient Query if possible
	 */

	try {
		let orderDetails = await Order.findById(orderBody.order_id);
		let selectedItemList;
		if(orderBody.reason){
			reason = orderBody.reason;
		}
	
		if (orderBody.kot_id) {

			selectedItemList = orderDetails.order_list.filter(order => {
				if (order._id == orderBody.kot_id) {
					return order;
				}
			})[0];
			// console.log("0");
			// console.log(selectedItemList);
		} else {
			selectedItemList = orderDetails.order_list.filter(order => {
				if (!order.kot_number && order.order_status=="placed") {
					isItemConfirmed = false
					orderBody.kot_id = order._id;
					return order;
				}
			})[0];
			// console.log("1");
			// console.log(selectedItemList);
		}

		if (selectedItemList && selectedItemList.item_details.length === 1) {
			let order_price;
			let grand_total;

			let total_price;
			let selectedItemDicountPrice = 0;

			if (isItemConfirmed) {
				/**
				 * remove item discount if exists
				 */
				if (orderDetails.item_discounts && orderDetails.item_discounts.discounted_items && orderDetails.item_discounts.discounted_items.length) {
					let selectedDicsountedItemIndex;
					let selectedDicsountedItem = orderDetails.item_discounts.discounted_items.filter((discounted_item, i) => {
						if (selectedItemList.item_details[0]._id == discounted_item.item_id) {
							selectedDicsountedItemIndex = i;
							return discounted_item;
						}
					})[0];
					if (selectedDicsountedItem) {
						selectedItemDicountPrice = selectedDicsountedItem.discounted_amount;
						orderDetails.item_discounts.discounted_items.splice(selectedDicsountedItemIndex, 1);
						orderDetails.item_discounts.total_discount = orderDetails.item_discounts.total_discount - selectedDicsountedItem.discounted_amount
						orderDetails.item_discounts.total_items = orderDetails.item_discounts.total_items - 1;
					}
				}

				/**
				 * remove order discount if exists 
				 */
				if (orderDetails.order_discount && orderDetails.order_discount.discount_type) {
					if (orderDetails.order_discount.discount_type === "amount") {
						let discount_amount = orderDetails.order_discount.discount_number;
						let updated_amount = Number(orderDetails.total_cost) - (selectedItemList.item_details[0].sold_price * selectedItemList.item_details[0].quantity);
						order_price = updated_amount > 0 ? updated_amount - discount_amount : 0;
					} else if (
						orderDetails.order_discount.discount_type === "percentage"
					) {
						//let discount_amount = orderDetails.order_discount.discount_number;
						// let updated_amount = Number(orderDetails.total_cost) - (selectedItemList.item_details[0].sold_price * selectedItemList.item_details[0].quantity);
						// order_price = updated_amount > 0 ? updated_amount - (discount_amount / 100) * updated_amount : 0;
						order_price = Number(orderDetails.total_cost) - selectedItemList.item_details[0].price_before_discount;
						total_price = Number(orderDetails.total_cost) - (selectedItemList.item_details[0].price_before_discount * selectedItemList.item_details[0].quantity);
					} else if (
						orderDetails.order_discount.discount_type === "new_value"
					) {
						order_price = orderDetails.order_discount.discount_number;
					} else if (orderDetails.order_discount.discount_type === "flat") {
						order_price = 0;
					}
				} else {
					/**@note commented and tried out with new conditions,  if problem occurs please
					 * feel free to uncomment and comment the condition code and try
					 */
					// order_price = Number(orderDetails.total_cost) - (selectedItemList.item_details[0].sold_price * selectedItemList.item_details[0].quantity);
					if(selectedItemList.item_details[0].discount_applied) {
						order_price = Number(orderDetails.total_cost_after_dicount) - (selectedItemList.item_details[0].sold_price * selectedItemList.item_details[0].quantity) + (selectedItemList.item_details[0].price_before_discount - selectedItemList.item_details[0].sold_price)  ;
					} else{
						order_price = Number(orderDetails.total_cost_after_dicount) - (selectedItemList.item_details[0].sold_price * selectedItemList.item_details[0].quantity);
					}
				}
			} else {
				/** @note : the changes commented here are test conditions incase if error happened
				 * in awiting status order please feel free to remove the comment and test it
				 */
				// if(selectedItemList.item_details[0].discount_applied) { 
					order_price = Number(orderDetails.total_cost);
				// } else {
				// 	order_price = Number(orderDetails.total_cost_after_dicount);
				// }
			}

			let query = { _id: orderBody.order_id };
			let update;
			let hasUnassignedItem = false;

			await asyncForEach(orderDetails.order_list, async (list) => {
				return list.item_details.some((item) => {
					if (!item.customer_id && (item._id !== selectedItemList.item_details[0]._id)) {
						hasUnassignedItem = true;
					}
				})
			})

			if (isItemConfirmed && ((Number(orderDetails.total_cost) - (selectedItemList.item_details[0].sold_price * selectedItemList.item_details[0].quantity) - selectedItemDicountPrice) == 0)) {
	     		/**
				 * Find Tax details
				 */
				let order_price_after_dicount = selectedItemDicountPrice > 0 ? order_price - selectedItemDicountPrice : order_price; // change this with calculations
				let order_tax_details = [];
				/**
				 * End of finding Tax Details
				*/

				let total_bill_tax_cost = 0;
				if (order_tax_details.length) {
					total_bill_tax_cost = order_tax_details
						.map(tax => tax.item_gst_price)
						.reduce((a, b) => a + b);
				}

				let total_cost = Number(orderDetails.total_cost) - (selectedItemList.item_details[0].sold_price * selectedItemList.item_details[0].quantity) - selectedItemDicountPrice;
				// // console.log(status);
				let setOptions = {
					"total_cost": total_cost,
					"final_cost": order_price - selectedItemDicountPrice,
					"has_unassigned_items": hasUnassignedItem,
					"order_discount.discount_type": undefined,
					"order_discount.discount_number": undefined,
					"order_tax_details": order_tax_details,
					"order_tax_amount": total_bill_tax_cost,
					"total_after_incl_tax": order_price_after_dicount + total_bill_tax_cost,
					"total_cost_after_dicount": order_price_after_dicount,
					"grand_total": order_price_after_dicount + total_bill_tax_cost,
					'order_list.$[order].item_details.$[item].item_status': status,
					'order_list.$[order].item_details.$[item].remove_reason': reason,

				}

				if (orderDetails.item_discounts) {
					setOptions.item_discounts = orderDetails.item_discounts;
				}

				if (orderDetails.is_applied_service_charge) {
					setOptions.service_charge_amount = order_price_after_dicount * (orderDetails.service_charge_percentage / 100);
					setOptions.grand_total = setOptions.grand_total + setOptions.service_charge_amount
				}
				grand_total = setOptions.grand_total;

				update = {
					// $pull: {
					// 	order_list: { _id: mongoose.Types.ObjectId(orderBody.kot_id) }
					// },
					$set: setOptions
				};
				// update = {
				// 	$pull: {
				// 		order_list: { _id: mongoose.Types.ObjectId(orderBody.kot_id) }
				// 	},
				// 	$set: setOptions
				// };
			} else if (!isItemConfirmed) {
				update = {
					// $pull: {
					// 	order_list: { _id: mongoose.Types.ObjectId(orderBody.kot_id) }
					// },
					$set: {
						"order_list.$[order].order_status":"rejected",
						'order_list.$[order].item_details.$[item].item_status': status,
						'order_list.$[order].item_details.$[item].remove_reason': reason,
						has_unassigned_items: hasUnassignedItem
					}
				};
			} else {
				/**
				 * Find Tax details
				 */
				let item_details_array = [];
				let order_price_after_dicount = order_price - selectedItemDicountPrice; // change this with calculations

				if (orderDetails.order_list && orderDetails.order_list.length) {
					await asyncForEach(orderDetails.order_list, async (previous_orders) => {
						if (previous_orders.kot_number != selectedItemList.kot_number) {
							item_details_array.push(previous_orders.item_details)
						}
					})
				}
				let total_cost = Number(orderDetails.total_cost) - (selectedItemList.item_details[0].sold_price * selectedItemList.item_details[0].quantity) - selectedItemDicountPrice ;
				let all_item_list = item_details_array.flat(Infinity);
				let tax_rates = all_item_list.map((item) => {
					if(item.item_status !== 'removed') {
						let new_tax_rates = item.tax_rates.filter((tax) => {
							if (tax.checked == true) {
								tax.item_price = item.sold_price * item.quantity;
								//let rounded_tax_rate = ((item.sold_price * item.quantity) * (tax.percentage / 100)).toFixed(2);
								let rounded_tax_rate = ((((item.sold_price / total_cost) * (order_price_after_dicount)) * item.quantity) * (tax.percentage / 100));
								tax.item_gst_price = Number(rounded_tax_rate)
								return tax
							} else {
								return false
							}
						})
						return new_tax_rates;
					}
				}).filter((x) => x);
				let tax_rates_array = tax_rates.flat(Infinity);
				let order_tax_details = [];
				tax_rates_array.reduce(function (res, value) {
					if (!res[value.tax_type]) {
						res[value.tax_type] = { tax_type: value.tax_type, item_gst_price: 0, tax_percentage: value.percentage };
						order_tax_details.push(res[value.tax_type])
					}
					res[value.tax_type].item_gst_price += value.item_gst_price;
					return res;
				}, {});
				/**
				 * End of finding Tax Details
				*/

				let total_bill_tax_cost = 0;
				if (order_tax_details.length) {
					total_bill_tax_cost = order_tax_details
						.map(tax => tax.item_gst_price)
						.reduce((a, b) => a + b);
				}

				let setOptions = {
					
					"total_cost": Number(orderDetails.total_cost) - (selectedItemList.item_details[0].sold_price * selectedItemList.item_details[0].quantity) - selectedItemDicountPrice,
					"final_cost": order_price - selectedItemDicountPrice,
					"has_unassigned_items": hasUnassignedItem,
					"order_tax_details": order_tax_details,
					"order_tax_amount": total_bill_tax_cost,
					"total_after_incl_tax": order_price_after_dicount + total_bill_tax_cost,
					"total_cost_after_dicount": order_price_after_dicount,
					"grand_total": order_price_after_dicount + total_bill_tax_cost,
					'order_list.$[order].item_details.$[item].item_status': status,
					'order_list.$[order].item_details.$[item].remove_reason': reason,
					}

				if (orderDetails.item_discounts) {
					setOptions.item_discounts = orderDetails.item_discounts;
				}

				if (orderDetails.is_applied_service_charge) {
					setOptions.service_charge_amount = order_price_after_dicount * (orderDetails.service_charge_percentage / 100);
					setOptions.grand_total = setOptions.grand_total + setOptions.service_charge_amount
				}
				grand_total = setOptions.grand_total;
				update = {
					// $pull: {
					// 	order_list: { _id: mongoose.Types.ObjectId(orderBody.kot_id) }
					// },
					$set: setOptions
				};
			}

			let updatedOrder = await Order.findOneAndUpdate(query, update, 
				{ new: true 
					, arrayFilters: [{ 'item._id': mongoose.Types.ObjectId( orderBody.item_id) },{'order._id': mongoose.Types.ObjectId( orderBody.kot_id)}]
				});

			if (updatedOrder.table_id) {
				const updatedResult = await Table.findOneAndUpdate(
					{ _id: updatedOrder.table_id },
					{
						$set: {
							has_alert: false,
							table_amount: grand_total ? grand_total : order_price,
							total_amount: grand_total ? grand_total : order_price
						}
					},
					{ new: true },
				);

				let tableData = {
					floor_id: updatedResult.floor_id
						? updatedResult.floor_id
						: undefined,
					branch_id: orderDetails.branch_id,
					table_id: orderDetails.table_id,
					message: "Order has been removed successfully",
					has_unassigned_item: hasUnassignedItem,
					order_status: "all_items_removed"
				};

				if (isItemConfirmed) {
					await reduceItemSoldCount(selectedItemList);
				}

				res.status(201).json({
					status: 1,
					message: "Order removed successfully"
				});
				socketController.io.sockets.in(orderDetails.branch_id).emit("update_table", tableData);
				socketController.io.sockets.in(orderDetails.branch_id).emit("update_order", tableData);
				socketController.io.sockets.in(orderDetails.table_id).emit("update_table", tableData);
				//socketController.io.sockets.in(orderDetails.branch_id).emit("update_order_kds", tableData);
				PushController.notifyTableMembers(orderDetails.table_id, {
					message: `Your order has been removed from your bill`
				})
			} else {
				res.status(201).json({
					status: 1,
					message: "Item removed successfully"
				});
			}
		} else if (selectedItemList && selectedItemList.item_details.length > 1) {
			let orderstatus;
			// Update a particular item
			let selectedItem = selectedItemList.item_details.filter((item, i) => {
				if (item._id == orderBody.item_id) {
					return item;
				}
			})[0];

			
			let hasUnassignedItem = false;
			
			await asyncForEach(orderDetails.order_list, async(list) => {
				return list.item_details.some((item) => {
					if (!item.customer_id && (item._id !== selectedItemList.item_details[0]._id)) {
						hasUnassignedItem = true;
					}
				})
			})

			if (orderDetails.item_discounts && orderDetails.item_discounts.discounted_items && orderDetails.item_discounts.discounted_items.length) {
				let selectedDicsountedItemIndex;
				let selectedDicsountedItem = orderDetails.item_discounts.discounted_items.filter((discounted_item, i) => {
					if (selectedItem._id == discounted_item.item_id) {
						selectedDicsountedItemIndex = i;
						return discounted_item;
					}
				})[0];
				if (selectedDicsountedItem) {
					orderDetails.item_discounts.discounted_items.splice(selectedDicsountedItemIndex, 1);
					orderDetails.item_discounts.total_discount = orderDetails.item_discounts.total_discount - selectedDicsountedItem.discounted_amount
					orderDetails.item_discounts.total_items = orderDetails.item_discounts.total_items - 1;
				}
			}
				
			let order_price;
			let total_price;
			let discount_amount;
			let updated_amount;
			if (isItemConfirmed && selectedItem.discount_applied && selectedItem.discount_detail.discount_type) {
				if (selectedItem.discount_detail.discount_type === "amount") {
					
					discount_amount = selectedItem.discount_detail.discount_number;
					updated_amount = Number(orderDetails.total_cost) - (selectedItem.sold_price * selectedItem.quantity);
				
				// console.log("amount");
				} else if (selectedItem.discount_detail.discount_type === "percentage") {
					// let discount_amount = selectedItem.discount_detail.discount_number;
					// let updated_amount = Number(orderDetails.total_cost) - (selectedItem.sold_price * selectedItem.quantity);
					//order_price = updated_amount > 0 ? updated_amount - (discount_amount / 100) * updated_amount : 0;
					// order_price = Number(orderDetails.total_cost) - selectedItem.price_before_discount;
					// total_price = Number(orderDetails.total_cost) - (selectedItem.price_before_discount * selectedItem.quantity);
					discount_amount = selectedItem.selling_price -  selectedItem.sold_price;
					updated_amount = Number(orderDetails.total_cost) - (selectedItem.sold_price * selectedItem.quantity);
					// console.log("percent");
				} else if (selectedItem.discount_detail.discount_type === "new_value") {
					// order_price = Number(orderDetails.total_cost) - selectedItem.price_before_discount;
					// total_price = Number(orderDetails.total_cost) - (selectedItem.price_before_discount * selectedItem.quantity);
					discount_amount = selectedItem.selling_price -  selectedItem.sold_price;
					updated_amount = Number(orderDetails.total_cost) - (selectedItem.sold_price * selectedItem.quantity);
					// console.log("newvalue");
				} else if (selectedItem.discount_detail.discount_type === "flat") {
					// order_price = Number(orderDetails.final_cost);
					// total_price = Number(orderDetails.final_cost);
					discount_amount = selectedItem.selling_price;
					updated_amount = Number(orderDetails.total_cost) - (selectedItem.sold_price * selectedItem.quantity);
					// console.log("flat");
				}
				order_price = updated_amount > 0 ? updated_amount - discount_amount : 0;
				total_price = Number(orderDetails.total_cost) - (selectedItem.price_before_discount * selectedItem.quantity);
			} else if (!isItemConfirmed) {
				// console.log("orderDetails");
				// console.log(orderDetails);
				order_price = Number(orderDetails.final_cost);
				total_price = Number(orderDetails.total_cost);
			} else {
				// console.log("isItemConfirmed");
				// console.log(orderDetails);
				order_price = Number(orderDetails.final_cost) - (selectedItem.sold_price * selectedItem.quantity);
				total_price = Number(orderDetails.total_cost) - (selectedItem.sold_price * selectedItem.quantity);
			}

			/**
			 * Find Tax details
			 */
			// console.log(selectedItem);
			let item_details_array = [];
			let order_price_after_dicount = order_price; // change this with calculations

			if (orderDetails.order_list && orderDetails.order_list.length) {
				await asyncForEach(orderDetails.order_list, async (previous_orders) => {
					await previous_orders.item_details.forEach((item) => {
						if (item._id !== selectedItem._id) {
							item_details_array.push(item)
						}
					})
				})
			}
			let all_item_list = item_details_array.flat(Infinity);
			let tax_rates = all_item_list.map((item) => {
				
					let new_tax_rates = item.tax_rates.filter((tax) => {
						if(item.item_status !=='removed') {
						if (tax.checked == true) {
							tax.item_price = item.sold_price * item.quantity;
							let rounded_tax_rate = ((((item.sold_price / total_price) * (order_price_after_dicount)) * item.quantity) * (tax.percentage / 100));
							tax.item_gst_price = Number(rounded_tax_rate)
							return tax
						} else {
							return false
						}
					}
					})
					return new_tax_rates;
			
			}).filter((x) => x);
			let tax_rates_array = tax_rates.flat(Infinity);
			let order_tax_details = [];
			if(total_price >  0){
			tax_rates_array.reduce(function (res, value) {
				if (!res[value.tax_type]) {
					res[value.tax_type] = { tax_type: value.tax_type, item_gst_price: 0, tax_percentage: value.percentage };
					order_tax_details.push(res[value.tax_type])
				}
				res[value.tax_type].item_gst_price += value.item_gst_price;
				return res;
			}, {});
		}
			/**
			 * End of finding Tax Details
			*/
			let total_bill_tax_cost = 0;
			// console.log(order_tax_details);
			if (order_tax_details.length) {
				total_bill_tax_cost = order_tax_details
					.map(tax => tax.item_gst_price)
					.reduce((a, b) => a + b);
			}
			let totalitems = selectedItemList.item_details.length;

			let removedItem = selectedItemList.item_details.filter((item, i) => {
				if (item._id != orderBody.item_id && item.item_status == "removed") {
					return item;
				}
			})
			let arrayfilter = { new: true
				, arrayFilters: [{ 'item._id': mongoose.Types.ObjectId( orderBody.item_id) }] 
			   };
			let setOptions = {
				"total_cost": total_price,
				"final_cost": order_price,
				"has_unassigned_items": hasUnassignedItem,
				"item_discounts": orderDetails.item_discounts,
				"order_tax_details": order_tax_details,
				"order_tax_amount": total_bill_tax_cost,
				"total_after_incl_tax": order_price_after_dicount + total_bill_tax_cost,
				"total_cost_after_dicount": order_price_after_dicount,
				"grand_total": order_price_after_dicount + total_bill_tax_cost,
				'order_list.$[].item_details.$[item].item_status': status,
				'order_list.$[].item_details.$[item].remove_reason': reason,
			};
			if (!isItemConfirmed) {
			if(totalitems == removedItem.length +1){
				setOptions= {
					"total_cost": total_price,
					"final_cost": order_price,
					"has_unassigned_items": hasUnassignedItem,
					"item_discounts": orderDetails.item_discounts,
					"order_tax_details": order_tax_details,
					"order_tax_amount": total_bill_tax_cost,
					"total_after_incl_tax": order_price_after_dicount + total_bill_tax_cost,
					"total_cost_after_dicount": order_price_after_dicount,
					"grand_total": order_price_after_dicount + total_bill_tax_cost,
					'order_list.$[order].item_details.$[item].item_status': status,
					'order_list.$[order].item_details.$[item].remove_reason': reason,
					"order_list.$[order].order_status" : "rejected"
				}
				arrayfilter = { new: true
					, arrayFilters: [{ 'item._id': mongoose.Types.ObjectId( orderBody.item_id) },{'order._id': mongoose.Types.ObjectId( orderBody.kot_id)}] 
				   }

			}
			
		} 

		
			if (orderDetails.is_applied_service_charge) {
				setOptions.service_charge_amount = order_price_after_dicount * (orderDetails.service_charge_percentage / 100);
				setOptions.grand_total = setOptions.grand_total + setOptions.service_charge_amount
			}

			let query = { _id: orderBody.order_id };
			let update = {
				// $pull: { "order_list.$[].item_details": { _id: orderBody.item_id } },
				$set: setOptions
			};

			let updatedOrder = await Order.findOneAndUpdate(query, update, arrayfilter)
			if (orderDetails.table_id) {
				let updatedTable = await Table.findOneAndUpdate(
					{ _id: orderDetails.table_id },
					{
						$set: {
							has_alert: false,
							table_amount: setOptions.grand_total,
							total_amount: setOptions.grand_total
						}
					},
					{ new: true }
				)
				let hasUnassignedItem = false;
				await asyncForEach(updatedOrder.order_list, (order) => {
					return order.item_details.some((item) => {
						if (!item.customer_id) {
							hasUnassignedItem = true;
						}
					})
				})
				let tableData = {
					floor_id: updatedTable.floor_id
						? updatedTable.floor_id
						: undefined,
					branch_id: orderDetails.branch_id,
					item_details: orderDetails.item_details,
					table_id: orderDetails.table_id,
					message: "Item has been removed successfully",
					has_unassigned_item: hasUnassignedItem,
					order_status: "removed"
				};
				
				res.status(201).json({
					status: 1,
					message: "Order removed successfully"
				});

				socketController.io.sockets.in(orderDetails.branch_id).emit("update_table", tableData);
				socketController.io.sockets.in(orderDetails.branch_id).emit("update_order", tableData);
				socketController.io.sockets.in(orderDetails.table_id).emit("update_table", tableData);
				socketController.io.sockets.in(orderDetails.branch_id).emit("update_order_kds", tableData);
				PushController.notifyTableMembers(orderDetails.table_id, {
					message: `Your item has been removed from your bill`
				})
			} else {
				res.status(201).json({
					status: 1,
					message: "Item removed successfully"
				});
			}
		} else {
			// return item not exists
			res.status(201).json({
				status: 0,
				message: "The item you are looking for is not found"
			});
		}
	} catch (err) {
		console.error({
			status: 0,
			message: "Error Updating item Status",
			error: err
		});
		res.status(500).json({
			status: 0,
			message: "Error Updating item Status",
			error: "Problem with the server"
		});
	}
};


/**
 * Action: Function used to delete order
 * Includes removing bills if exists
 * and put them in order and bill history
 */
exports.deleteOrder = (req, res) => {
	let orderId = req.params.param1;
	Order.findOne({ _id: orderId }, (err, order) => {
		if (err) {
			console.error({
				status: 0,
				message: "Error getting Order",
				error: err
			});
			res.status(404).json({
				status: 0,
				message: "Error getting Order",
				error: "Problem with the server"
			});
		} else if (order) {
			let order_detail = JSON.parse(JSON.stringify(order));
			let history_order = new HistoryOrders(order_detail);
			history_order.save((err, orderHistory) => {
				if (err) {
					console.error({
						status: 0,
						message: "Problem saving order history",
						error: err
					});
					res.status(500).json({
						status: 0,
						message: "Problem saving order history",
						error: "Problem with the server"
					});
				} else {
					Order.findByIdAndRemove(orderId, (err, removedOrder) => {
						if (err) {
							console.error({
								status: 0,
								message: "Problem removing the existing order",
								error: err
							});
							res.status(500).json({
								status: 0,
								message: "Problem removing the existing order",
								error: "Problem with the server"
							});
						} else {
							/**
							 * Send sockets and push msgs
							 */
							if (order.order_type === 'in_house') {
								let tableData = {
									floor_id: order.floor_id ? order.floor_id : undefined,
									branch_id: order.branch_id,
									item_details: order.item_details,
									table_id: order.table_id,
									order_status: 'deleted',
									message: 'order deleted'
								};
								socketController.io.sockets.in(order.table_id).emit("update_table", tableData);
							} else if (order.order_type === 'take_aways') {
								let orderData = {
									_id: order._id,
									order_id: order.order_id,
									order_status: 'deleted',
									message: `order deleted`
								};
								socketController.io.sockets.in(order.order_id).emit("update_takeaway", orderData);
							}

							Bill.findOne({ order_id: orderId }, (err, bills) => {
								if (err) {
									console.error({
										status: 0,
										message: "Problem getting table bills",
										error: err
									});
									res.status(500).json({
										status: 0,
										message: "Problem getting table bills",
										error: "Problem with the server"
									});
								} else if (bills) {
									let bill_detail = JSON.parse(JSON.stringify(bills));
									let bill_history = new HistoryBills(bill_detail);
									bill_history.save((err, billHistory) => {
										if (err) {
											console.error({
												status: 0,
												message: "Problem while moving bill to history",
												error: err
											});
											res.status(500).json({
												status: 0,
												message: "Problem while moving bill to history",
												error: "Problem with the server"
											});
										} else {
											Bill.findOneAndRemove(
												{ order_id: orderId },
												(err, removedBill) => {
													if (err) {
														console.error({
															status: 0,
															message: "Problem removing bill",
															error: err
														});
														res.status(500).json({
															status: 0,
															message: "Problem removing bill",
															error: "Problem with the server"
														});
													} else {
														if (order.table_id) {
															Table.findOneAndUpdate(
																{ _id: order.table_id },
																{ $set: { total_amount: 0, total_amount: 0 } },
																{ new: true },
																(err, updatedTable) => {
																	if (err) {
																		console.error({
																			status: 0,
																			message: "Error updating order",
																			error: err
																		});
																		res.status(404).json({
																			status: 0,
																			message: "Error updating order",
																			error: "Problwm with the server"
																		});
																	} else {
																		QuickService.findOne(
																			{ table_id: order.table_id },
																			(err, service) => {
																				if (err) {
																					console.error({
																						status: 0,
																						message: "error resetting service",
																						error: err
																					});
																					res.status(500).json({
																						status: 0,
																						message: "error resetting service",
																						error: "problem with the server"
																					});
																				} else if (service) {
																					// service._id = undefined;
																					let quick_service_history = new QuickServiceHistory(
																						JSON.parse(JSON.stringify(service))
																					);
																					quick_service_history.save(
																						(err, serviceHistory) => {
																							if (err) {
																								console.error({
																									status: 0,
																									message:
																										"error resetting service",
																									error: err
																								});
																								res.status(500).json({
																									status: 0,
																									message:
																										"error resetting service",
																									error:
																										"problem with the server"
																								});
																							} else {
																								QuickService.remove(
																									{ table_id: order.table_id },
																									(err, removedResult) => {
																										if (err) {
																											console.error({
																												status: 0,
																												message:
																													"error resetting service",
																												error: err
																											});
																											res.status(500).json({
																												status: 0,
																												message:
																													"error resetting service",
																												error:
																													"problem with the server"
																											});
																										} else {
																											res.status(200).json({
																												status: 1,
																												message:
																													"Order removed Successfully"
																											});
																											PushController.notifyTableMembers(
																												order.table_id,
																												{ message: `Your last Order has been successfuly removed!` }
																											);
																										}
																									}
																								);
																							}
																						}
																					);
																				} else {
																					res.status(200).json({
																						status: 1,
																						message:
																							"Order removed Successfully"
																					});
																					PushController.notifyTableMembers(
																						order.table_id,
																						{ message: `Your last Order has been successfuly removed!` }
																					);
																				}
																			}
																		);
																	}
																}
															);
														} else if (order.order_id) {
															QuickService.findOne(
																{ takeaway_id: order.order_id },
																(err, service) => {
																	if (err) {
																		console.error({
																			status: 0,
																			message: "error resetting service",
																			error: err
																		});
																		res.status(500).json({
																			status: 0,
																			message: "error resetting service",
																			error: "problem with the server"
																		});
																	} else if (service) {
																		// service._id = undefined;
																		let quick_service_history = new QuickServiceHistory(
																			JSON.parse(JSON.stringify(service))
																		);
																		quick_service_history.save(
																			(err, serviceHistory) => {
																				if (err) {
																					console.error({
																						status: 0,
																						message: "error resetting service",
																						error: err
																					});
																					res.status(500).json({
																						status: 0,
																						message: "error resetting service",
																						error: "problem with the server"
																					});
																				} else {
																					QuickService.remove(
																						{ takeaway_id: order.order_id },
																						(err, removedResult) => {
																							if (err) {
																								console.error({
																									status: 0,
																									message:
																										"error resetting service",
																									error: err
																								});
																								res.status(500).json({
																									status: 0,
																									message:
																										"error resetting service",
																									error:
																										"problem with the server"
																								});
																							} else {
																								res.status(200).json({
																									status: 1,
																									message:
																										"Order removed Successfully"
																								});
																								PushController.notifyOrderMembers(
																									order.order_id,
																									{ message: `Your last Order has been successfuly removed!` }
																								);
																							}
																						}
																					);
																				}
																			}
																		);
																	} else {
																		res.status(200).json({
																			status: 1,
																			message: "Order removed Successfully"
																		});
																		// PushController.notifyTableMembers(order.table_id, { message: `Your last Order has been successfuly removed!` });
																	}
																}
															);
														} else {
															res.status(200).json({
																status: 1,
																message: "Order removed Successfully"
															});
														}
													}
												}
											);
										}
									});
								} else {
									if (order.table_id) {
										Table.findOneAndUpdate(
											{ _id: order.table_id },
											{ $set: { total_amount: 0, table_amount: 0 } },
											{ new: true },
											(err, updatedTable) => {
												if (err) {
													console.error({
														status: 0,
														message: "Error updating order",
														error: err
													});
													res.status(404).json({
														status: 0,
														message: "Error updating order",
														error: "Problwm with the server"
													});
												} else {
													QuickService.findOne(
														{ table_id: order.table_id },
														(err, service) => {
															if (err) {
																console.error({
																	status: 0,
																	message: "error resetting service",
																	error: err
																});
																res.status(500).json({
																	status: 0,
																	message: "error resetting service",
																	error: "problem with the server"
																});
															} else if (service) {
																// service._id = undefined;
																let quick_service_history = new QuickServiceHistory(
																	JSON.parse(JSON.stringify(service))
																);
																quick_service_history.save(
																	(err, serviceHistory) => {
																		if (err) {
																			console.error({
																				status: 0,
																				message: "error resetting service",
																				error: err
																			});
																			res.status(500).json({
																				status: 0,
																				message: "error resetting service",
																				error: "problem with the server"
																			});
																		} else {
																			QuickService.remove(
																				{ table_id: order.table_id },
																				(err, removedResult) => {
																					if (err) {
																						console.error({
																							status: 0,
																							message:
																								"error resetting service",
																							error: err
																						});
																						res.status(500).json({
																							status: 0,
																							message:
																								"error resetting service",
																							error: "problem with the server"
																						});
																					} else {
																						res.status(200).json({
																							status: 1,
																							message:
																								"Order removed Successfully"
																						});
																						PushController.notifyTableMembers(
																							order.table_id,
																							{ message: `Your last Order has been successfuly removed!` }
																						);
																					}
																				}
																			);
																		}
																	}
																);
															} else {
																res.status(200).json({
																	status: 1,
																	message: "Order removed Successfully"
																});
																PushController.notifyTableMembers(
																	order.table_id,
																	{ message: `Your last Order has been successfuly removed!` }
																);
															}
														}
													);
												}
											}
										);
									} else if (order.order_id) {
										QuickService.findOne(
											{ takeaway_id: order.order_id },
											(err, service) => {
												if (err) {
													console.error({
														status: 0,
														message: "error resetting service",
														error: err
													});
													res.status(500).json({
														status: 0,
														message: "error resetting service",
														error: "problem with the server"
													});
												} else if (service) {
													// service._id = undefined;
													let quick_service_history = new QuickServiceHistory(
														JSON.parse(JSON.stringify(service))
													);
													quick_service_history.save((err, serviceHistory) => {
														if (err) {
															console.error({
																status: 0,
																message: "error resetting service",
																error: err
															});
															res.status(500).json({
																status: 0,
																message: "error resetting service",
																error: "problem with the server"
															});
														} else {
															QuickService.remove(
																{ takeaway_id: order.order_id },
																(err, removedResult) => {
																	if (err) {
																		console.error({
																			status: 0,
																			message: "error resetting service",
																			error: err
																		});
																		res.status(500).json({
																			status: 0,
																			message: "error resetting service",
																			error: "problem with the server"
																		});
																	} else {
																		res.status(200).json({
																			status: 1,
																			message: "Order removed Successfully"
																		});
																		PushController.notifyOrderMembers(
																			order.order_id,
																			{ message: `Your last Order has been successfuly removed!` }
																		);
																	}
																}
															);
														}
													});
												} else {
													res.status(200).json({
														status: 1,
														message: "Order removed Successfully"
													});
													PushController.notifyOrderMembers(order.order_id, {
														message: `Your last Order has been successfuly removed!`
													});
												}
											}
										);
									} else {
										res.status(200).json({
											status: 1,
											message: "Order removed Successfully"
										});
									}
								}
							});
						}
					});
				}
			});
		} else {
			console.error({
				status: 0,
				message: "No Order Found"
			});
			res.status(404).json({
				status: 0,
				message: "No Orders Found",
				error: "No Orders Found"
			});
		}
	});
};

/**
 * ============== Get Methods For All types of Orders ================
 */
exports.getAllHomeDelivery = (req, res) => {
	Order.find(
		{ company_id: req.companyId, order_type: "home_delivery" },
		(err, orders) => {
			if (err) {
				console.error({
					status: 0,
					message: "Error updating Delivery details",
					error: err
				});
				res.status(500).json({
					status: 0,
					message: "Error updating Delivery Details",
					error: "problem with the server"
				});
			} else {
				res.status(201).json({
					status: 1,
					message: "Order Obtained Successfully"
				});
			}
		}
	);
};

exports.getHomeDelivery = (req, res) => {
	let query_value = "";
	if (req.accessType == "superadmin" || req.accessType === "admin" || req.accessType === "staffs") {
		query_value = req.params.branchId;
		getorders();
	} else {
		res.status(401).json({
			status: 0,
			message: "Unauthorized Access"
		});
	}

	async function getorders() {
		if (!req.params.deliveryId && query_value) {
			/**
			 *   NOTE: Not using this API as for now, Since we get the whole order list with a single APi
			 *  But will be helpful in future if you need particular api for home deliveries
			 *  can be used to takeaways also :)
			 * */
			Order.find(
				{ branch_id: query_value, order_type: "home_delivery" },
				(err, orders) => {
					if (err) {
						console.error({
							status: 0,
							message: "Error getting branch orders",
							error: err
						});
						res.status(500).json({
							status: 0,
							message: "Error getting branch orders",
							error: "Problem with the server"
						});
					} else {
						res.status(200).json({
							status: 1,
							message: "Orders Obtained Successfully",
							orders: orders
						});
					}
				}
			);
		} else if (req.params.deliveryId) {
			Order.findOne({ delivery_id: req.params.deliveryId }, (err, orders) => {
				if (err) {
					console.error({
						status: 0,
						message: "Error getting Online orders",
						error: err
					});
					res.status(500).json({
						status: 0,
						message: "Error getting Online orders",
						error: "Problem with the server"
					});
				} else {
					res.status(200).json({
						status: 1,
						message: "Orders Obtained Successfully",
						orders: orders
					});
				}
			});
		}
	}
};

exports.getAllTakeaways = (req, res) => {
	Order.find(
		{ company_id: req.companyId, order_type: "take_aways" },
		(err, orders) => {
			if (err) {
				console.error({
					status: 0,
					message: "Error getting Takeaway orders",
					error: err
				});
				res.status(500).json({
					status: 0,
					message: "Error getting Takeaway orders",
					error: "Problem with the server"
				});
			} else {
				res.status(200).json({
					status: 1,
					message: "Orders Obtained Successfully",
					orders: orders
				});
			}
		}
	);
};

exports.getTakeaways = (req, res) => {
	let query_value = "";
	if (req.accessType == "superadmin" || req.accessType === "admin" || req.accessType === "staffs") {
		query_value = req.params.branchId;
		getOrders();
	} else {
		res.status(401).json({
			status: 0,
			message: "Unauthorized Access"
		});
	}

	async function getOrders() {
		if (!req.params.orderId && query_value) {
			Order.find(
				{ branch_id: query_value, order_type: "take_aways" },
				(err, orders) => {
					if (err) {
						console.error({
							status: 0,
							message: "Error getting Takeaway orders",
							error: err
						});
						res.status(500).json({
							status: 0,
							message: "Error getting Takeaway orders",
							error: "Problem with the server"
						});
					}
					res.status(200).json({
						status: 1,
						message: "Orders Obtained Successfully",
						orders: orders
					});
				}
			);
		} else if (req.params.orderId) {
			Order.findOne({ order_id: req.params.orderId }, (err, orders) => {
				if (err) {
					console.error({
						status: 0,
						message: "Error getting Takeaway orders",
						error: err
					});
					res.status(500).json({
						status: 0,
						message: "Error getting Takeaway orders",
						error: "Problem with the server"
					});
				}
				res.status(200).json({
					status: 1,
					message: "Orders Obtained Successfully",
					orders: orders
				});
			});
		}
	}
};

exports.getAllTableOrder = (req, res) => {
	Order.find(
		{ company_id: req.companyId, order_type: "in_house" },
		(err, orders) => {
			if (err) {
				console.error({
					status: 0,
					message: "Error getting Takeaway orders",
					error: err
				});
				res.status(500).json({
					status: 0,
					message: "Error getting Takeaway orders",
					error: "Problem with the server"
				});
			} else {
				res.status(200).json({
					status: 1,
					message: "Orders Obtained Successfully",
					orders: orders
				});
			}
		}
	);
};

exports.getTableOrder = (req, res) => {
	let query_value = "";
	if (req.accessType === "superadmin" || req.accessType === "admin" || req.accessType === "staffs") {
		query_value = req.params.branchId;
		getOrders();
	} else {
		res.status(401).json({
			status: 0,
			message: "Unauthorized Access"
		});
	}

	async function getOrders() {
		if (!req.params.orderId && query_value) {
			Order.find(
				{ branch_id: query_value, order_type: "in_house" },
				(err, orders) => {
					if (err) {
						console.error({
							status: 0,
							message: "Error getting Takeaway orders",
							error: err
						});
						res.status(500).json({
							status: 0,
							message: "Error getting Takeaway orders",
							error: "Problem with the server"
						});
					}
					res.status(200).json({
						status: 1,
						message: "Orders Obtained Successfully",
						orders: orders
					});
				}
			);
		} else if (req.params.orderId) {
			Order.findOne({ order_id: req.params.orderId }, (err, orders) => {
				if (err) {
					console.error({
						status: 0,
						message: "Error getting Takeaway orders",
						error: err
					});
					res.status(500).json({
						status: 0,
						message: "Error getting Takeaway orders",
						error: "Problem with the server"
					});
				}
				res.status(200).json({
					status: 1,
					message: "Orders Obtained Successfully",
					orders: orders
				});
			});
		}
	}
};


/**
 * ================ COMMON FUNCTIONS ==================
 */
async function updateRecommended(grouped_sold_items) {
	let IS_EXCEEDED_FEATURED_COUNT;
	let IS_EXCEEDED_ITEM_COUNT;
	let RECOMMENDED_ITEM_COUNT;
	await grouped_sold_items.forEach(async (item) => {
		await MenuItemController.update({ _id: item.item_id }, { $inc: { item_sold_in_month: item.quantity, item_sold_count_total: item.quantity } });
	});
	await grouped_sold_items.forEach(async (item) => {
		let activeItemList = await MenuItemController.aggregate([
			{ $match: { category_id: item.category_id, item_status: { $ne: 'removed' } } },
			{
				$project: {
					__v: 0,
					available_days: 0,
					addons: 0,
					selling_price: 0,
					item_description: 0
				}
			}
		]);

		if (activeItemList.length < 4) {
			RECOMMENDED_ITEM_COUNT = 1;
		} else if (activeItemList.length > 4 && activeItemList.length < 12) {
			RECOMMENDED_ITEM_COUNT = 2;
		} else {
			RECOMMENDED_ITEM_COUNT = 3;
		}

		let existingRecommendedItemList = await MenuItemController.aggregate([
			{ $match: { category_id: item.category_id, tags: 'recommended', item_status: { $ne: 'removed' } } },
			{
				$project: {
					__v: 0,
					available_days: 0,
					addons: 0,
					selling_price: 0,
					item_description: 0
				}
			}
		]);

		let mostSoldItemsOfMonth = await MenuItemController.aggregate([
			{ $match: { category_id: item.category_id, item_status: { $ne: 'removed' } } },
			{
				$project: {
					__v: 0,
					available_days: 0,
					addons: 0,
					selling_price: 0,
					item_description: 0
				}
			}
		]).sort({ item_sold_in_month: -1 }).limit(RECOMMENDED_ITEM_COUNT) //Limted Count will be based on the item count
		//SCENARIO: Item Lesser than 2 andd no recommendation found, make the available item as recommended
		let removedTagItems = await MenuItemController.updateMany({ category_id: item.category_id, tags: 'recommended' }, { $set: { tags: '' } });
		let updatedTagItems = await mostSoldItemsOfMonth.forEach(async (item) => {
			let updatedData = await MenuItemController.findOneAndUpdate({ _id: item._id }, { $set: { tags: 'recommended' } });
		});
	})
}

async function reduceItemSoldCount(passedItem) {
	let item_id = passedItem.item_details[0].item_id;
	let quantity = passedItem.item_details[0].quantity;
	try {
		let RECOMMENDED_ITEM_COUNT;
		let updatedItem = await MenuItemController.findOneAndUpdate({ _id: item_id }, { $inc: { item_sold_count_total: -quantity, item_sold_in_month: -quantity } });
		let totalItemCount = await MenuItemController.find({ category_id: updatedItem.category_id, item_status: { $ne: 'removed' } }).count();
		if (totalItemCount < 4) {
			RECOMMENDED_ITEM_COUNT = 1;
		} else if (totalItemCount > 4 && totalItemCount < 12) {
			RECOMMENDED_ITEM_COUNT = 2;
		} else {
			RECOMMENDED_ITEM_COUNT = 3;
		}
		if (updatedItem.tags == 'recommended') {
			let mostSoldItemsOfMonth = await MenuItemController.aggregate([
				{ $match: { category_id: updatedItem.category_id, item_status: { $ne: 'removed' } } },
				{
					$project: {
						__v: 0,
						available_days: 0,
						addons: 0,
						selling_price: 0,
						item_description: 0
					}
				}
			]).sort({ item_sold_in_month: -1 }).limit(RECOMMENDED_ITEM_COUNT) //Limted Count will be based on the item count
			let removedTagItems = await MenuItemController.updateMany({ category_id: updatedItem.category_id, tags: 'recommended' }, { $set: { tags: '' } });
			let updatedTagItems = await mostSoldItemsOfMonth.forEach(async (item) => {
				let updatedData = await MenuItemController.findOneAndUpdate({ _id: item._id }, { $set: { tags: 'recommended' } });
			});

			return updatedTagItems;
		} else {
			return;
		}
	} catch (err) {
		console.error('error occured on reducing item count', err);
		return err;
	}
}


async function updateCount(branchId, type, orderType) {
	try {
		let branchResult = await Branches.findOne({ _id: branchId });
		if (branchResult) {
			let option;
			let new_kot_count;
			let new_order_count;
			let new_order_type_count;
			if (type === 'kot') {
				let kot_count = branchResult.counters.kot_count;
				new_kot_count = await getnextValue(kot_count);
				option = { $set: { 'counters.kot_count': new_kot_count } };
				// return new_kot_count;
			} else if (type === 'order') {
				let order_count = branchResult.counters.order_count;
				new_order_count = await getnextValue(order_count);
				let order_type_count;
				if (orderType === 'in_house') {
					order_type_count = branchResult.counters.table_order_count;
					new_order_type_count = await getnextValue(order_type_count);
					option = { $set: { 'counters.order_count': new_order_count, 'counters.table_order_count': new_order_type_count } };
				} else if (orderType === 'take_aways') {
					order_type_count = branchResult.counters.take_away_count;
					new_order_type_count = await getnextValue(order_type_count);
					option = { $set: { 'counters.order_count': new_order_count, 'counters.take_away_count': new_order_type_count } };
				} else if (orderType === 'home_delivery') {
					order_type_count = branchResult.counters.home_delivery_count;
					new_order_type_count = await getnextValue(order_type_count);
					option = { $set: { 'counters.order_count': new_order_count, 'counters.home_delivery_count': new_order_type_count } };
				} else {
					order_type_count = branchResult.counters.online_order_count;
					new_order_type_count = await getnextValue(order_type_count);
					option = { $set: { 'counters.order_count': new_order_count, 'counters.online_order_count': new_order_type_count } };
				}
			}
			/**
			 * the purpose is only for kot,  
			 */
			// else if(type === 'table'){
			// 	let order_count = branchResult.counters.order_count;
			// 	let table_order_count = branchResult.counters.table_order_count;
			// 	let new_order_count = await getnextValue(order_count);
			// 	let new_table_count = await getnextValue(table_order_count);
			// 	option = { $set: { 'counters.order_count': new_order_count, 'counters.table_order_count': new_table_count }}
			// }else if(type === 'take_away'){
			// 	let order_count = branchResult.counters.order_count;
			// 	let take_away_count = branchResult.counters.take_away_count;
			// 	let new_order_count = await getnextValue(order_count);
			// 	let new_take_away_count = await getnextValue(take_away_count);
			// 	option = { $set: { 'counters.order_count': new_order_count, 'counters.take_away_count': new_take_away_count }}
			// }else if(type === 'online') {
			// 	let order_count = branchResult.counters.order_count;
			// 	let online_order_count = branchResult.counters.online_order_count;
			// 	let new_order_count = await getnextValue(order_count);
			// 	let new_online_order_count = await getnextValue(online_order_count);
			// 	option = { $set: { 'counters.order_count': new_order_count, 'counters.online_order_count': new_online_order_count }}
			// }else if(type === 'home_delivery') {
			// 	let order_count = branchResult.counters.order_count;
			// 	let home_delivery_count = branchResult.counters.home_delivery_count;
			// 	let new_order_count = await getnextValue(order_count);
			// 	let new_home_delivery_count = await getnextValue(home_delivery_count);
			// 	option = { $set: { 'counters.order_count': new_order_count, 'counters.home_delivery_count': new_home_delivery_count }}
			// }

			async function getnextValue(value) {
				let isStartsWithNumber = value.match(/^\d/);
				let stringArray = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M',
					'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];
				if (isStartsWithNumber) {
					let nextValue = pad(String(Number(value) + 1), value.length)
					let nextId;
					if (nextValue.length > value.length) {
						nextId = stringArray[0] + nextValue.slice(1, value.length);
					} else {
						nextId = nextValue;
					}
					return nextId;
				} else {
					let thenum = value.replace(/^\D+/g, '');
					let indexString = value.charAt(0);
					let nextDigit = String(Number(thenum) + 1);
					let next_number = (nextDigit.length < (value.length - 1) ? pad("0" + nextDigit, (value.length - 1)) : nextDigit);
					if (nextDigit.length == value.length) {
						next_number = next_number.slice(1, value.length);
						indexString = stringArray[stringArray.indexOf(indexString) + 1];
					}
					return indexString + next_number;
				}
			}

			async function pad(str, max) {
				str = str.toString();
				return str.length < max ? pad("0" + str, max) : str;
			}

			await Branches.findOneAndUpdate({ _id: branchId }, option);
			if (type === 'kot') {
				return new_kot_count;
			} else {
				return { new_order_count: new_order_count, new_order_type_count: new_order_type_count };
			}
		} else {
			return new Error('invalid access');
		}
	} catch (e) {
		return new Error('invalid access');
	}
}

async function asyncForEach(array, callback) {
	for (let index = 0; index < array.length; index++) {
		await callback(array[index], index, array);
	}
}

exports.updateCount = updateCount;