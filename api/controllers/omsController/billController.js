"use strict";

const Bill = require("../../models/omsModels/bill.model");
const Orders = require("../../models/omsModels/order.model");
const Tables = require("../../models/omsModels/table.model");
const HistoryOrders = require("../../models/history/omsModels/order_history.model");
const HistoryBills = require("../../models/history/omsModels/bill_history.model");
const HistoryTables = require("../../models/history/omsModels/table_history.model");
const PushController = require("../../controllers/common/push.controller");
const socketController = require("../common/socket.controller");
const QuickService = require("../../models/omsModels/quick_service.model");
const QuickServiceHistory = require("../../models/history/omsModels/quick_services_history.model");
const FinanceLookup = require('../../models/finance_lookup.model');
const PaymentHistory = require('../../models/history/omsModels/payment_history.model');

/**
 * Not in use
*/
exports.getBill = (req, res) => { };

exports.getBills = async (req, res) => {
	// let branchId;
	let paramId;
	let query;
	let paramType;

	if (req.accessType === "superadmin" || req.accessType === "admin" || req.accessType === 'staffs') {
		paramType = req.params.type;
		paramId = req.params.typeId;

		if (!paramType || !paramId) {
			console.error({
				status: 0,
				message: "Error Getting bills, invalid parameters",
				error: "Invalid Params"
			});
			res.status(404).json({
				status: 0,
				message: "Error Getting bills, invalid parameters",
				error: "Invalid Params"
			});
		} else if (
			paramType === "table" ||
			paramType === "takeaway" ||
			paramType === "delivery" ||
			paramType === "order"
		) {
			if (paramType == "table") {
				query = { table_id: paramId };
			} else if (paramType == "takeaway") {
				paramId = req.params.typeId;
				query = { takeaway_id: paramId };
			} else if (paramType == "delivery") {
				paramId = req.params.typeId;
				query = { delivery_id: paramId };
			} else if (paramType == "order") {
				paramId = req.params.typeId;
				query = { order_id: paramId };
			}
			await listBill();
		} else {
			console.error({
				status: 0,
				message: "Please check the parameters",
				error: "Invalid Params"
			});
			res.status(404).json({
				status: 0,
				message: "Please check the parameters",
				error: "Invalid Params"
			});
		}
	} else if (req.accessType === "guest") {
		paramType = req.params.type;
		paramId = req.params.typeId;

		if (!paramType || !paramId || !req.branchId) {
			console.error({
				status: 0,
				message: "Error Getting bills, invalid parameters",
				error: "Invalid Params"
			});
			res.status(404).json({
				status: 0,
				message: "Error Getting bills, invalid parameters",
				error: "Invalid Params"
			});
		} else if (
			paramType === "table" ||
			paramType === "takeaway" ||
			paramType === "delivery" ||
			paramType === "order"
		) {
			if (paramType == "table") {
				query = { table_id: paramId };
			} else if (paramType == "takeaway") {
				// paramId = req.params.typeId;
				query = { takeaway_id: paramId };
			} else if (paramType == "delivery") {
				// paramId = req.params.typeId;
				query = { delivery_id: paramId };
			} else if (paramType == "order") {
				// paramId = req.params.typeId;
				query = { order_id: paramId };
			}
			await listBill();
		} else {
			console.error({
				status: 0,
				message: "Please check the parameters",
				error: "Invalid Params"
			});
			res.status(404).json({
				status: 0,
				message: "Please check the parameters",
				error: "Invalid Params"
			});
		}
		// if (req.tableId) {
		// 	paramId = req.tableId;
		// 	query = { table_id: paramId };
		// } else if (req.orderId) {
		// 	paramId = req.orderId; //Here the guest orderId is the takeaway Id
		// 	query = { takeaway_id: paramId };
		// } else if (req.deliveryId) {
		// 	paramId = req.deliveryId;
		// 	query = { delivery_id: paramId };
		// }
		// if (!paramId || !req.branchId) {
		// 	console.error({
		// 		status: 0,
		// 		message: "No proper Access",
		// 		error: "Invalid Access"
		// 	});
		// 	res.status(401).json({
		// 		status: 0,
		// 		message: "No proper Access",
		// 		error: "Invalid Access"
		// 	});
		// } else {
		// 	// branchId = req.branchId
		// 	// tableId = req.tableId;
		// 	await listBill();
		// }
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

	function revertBackUsers(status, code, type, message, data) {
		if(type === 'success') {
			res.status(code).json({
				status: status,
				message: "Bills Obtained Successfully",
				bills: data
			});
		}else if(type === 'error'){
			res.status(code).json({
				status: status,
				message: message,
				error: data
			});
		}
		
	}

	// NOTE: use findOne if want an object as response
	async function listBill() {
		try {
			async function getBills() {
				return await Bill.findOne(query);
			}
			let bills = await getBills();
			// , async (err, bills) => {
			// 	if (err) {
			// 		console.error({
			// 			status: 0,
			// 			message: "Error getting table bills",
			// 			error: err
			// 		});
			// 		// res.status(500).json({
			// 		// 	status: 0,
			// 		// 	message: "Error getting table bills",
			// 		// 	error: "problem with the server"
			// 		// });
			// 		revertBackUsers(0, 500, 'error', "Error getting table bills", "problem with the server")
			// 	} else {
			if (!bills) {
				console.error({
					status: 0,
					message: "No bills available for the particular table",
					error:  "No bills available for the particular table"
				});
				// res.status(200).json({
				// 	status: 0,
				// 	message: "No bills available for the particular table",
				// 	error: "problem with the server"
				// });
				revertBackUsers(0, 200, 'error', "No bills available for the particular table", "problem with the server")
			} else if (bills.bill_type === "my_share" && req.accessType === "guest") {
				let sortedBill = bills.bills.map(bill => {
					if (bill.orderer_id === req.userId) {
						bill["my_order"] = true;
					} else {
						bill["my_order"] = false;
					}
					return bill;
				});
				bills.bills = sortedBill;
				// res.status(200).json({
				// 	status: 1,
				// 	message: "Bills Obtained Successfully",
				// 	bills: bills
				// });
				revertBackUsers(1, 200, 'success', "Bills Obtained Successfully", bills)
			} else {
				// res.status(200).json({
				// 	status: 1,
				// 	message: "Bills Obtained Successfully",
				// 	bills: bills
				// });
				revertBackUsers(1, 200, 'success', "Bills Obtained Successfully", bills)
			}
			// 	}
			// });
		} catch(err) {
			console.error('Error listing bill =>', err)
		}
	}
};

/**
 * Backup, delete if not needed
 */
exports.addBill_bkp = (req, res) => {
	//TODO: Need to add Bill
	let billDetails = req.body.bill_details;

	billDetails["company_id"] = req.companyId;
	billDetails["branch_id"] = req.branchId || billDetails.branch_id;

	let bill = new Bill(billDetails);
	bill.save((err, addedBill) => {
		if (err) {
			console.error({
				status: 0,
				message: "Error adding bills",
				error: err
			});
			res.status(500).json({
				status: 0,
				message: "Error adding bills",
				error: "problem with the server"
			});
		} else {
			Orders.findOneAndUpdate(
				{ _id: addedBill.order_id },
				{ $set: { order_status: "awaiting_payment", bill_id: addedBill._id } },
				{ new: true },
				(err, updatedOrder) => {
					if (err) {
						console.error({
							status: 0,
							message: "Error adding bill",
							error: err
						});
						res.status(404).json({
							status: 0,
							message: "Error adding bill",
							error: "Problwm with the server"
						});
					} else {
						if (billDetails.table_id) {
							Tables.findOne(
								{ _id: billDetails.table_id },
								(err, tableDetails) => {
									if (err) {
										console.error({
											status: 0,
											message: "error adding bill",
											error: err
										});
										res.status(500).json({
											status: 0,
											message: "error adding bill",
											error: "problem with the server"
										});
									} else if (tableDetails) {
										let tableData = {
											table_id: billDetails.table_id,
											floor_id: tableDetails.floor_id,
											branch_id: tableDetails.branch_id,
											message: "bill added successfully"
										};

										let orderData = {
											branch_id: tableDetails.branch_id,
											table_id: billDetails.table_id,
											message: "bill added successfully",
											order_status: updatedOrder.order_status
												? updatedOrder.order_status
												: "awaiting_payment"
										};

										socketController.io.sockets
											.in(tableDetails.branch_id)
											.emit("update_table", tableData);
										socketController.io.sockets
											.in(tableDetails.branch_id)
											.emit("update_order", orderData);
										socketController.io.sockets
											.in(billDetails.table_id)
											.emit("update_table", tableData);
										res.status(201).json({
											status: 1,
											message: "Bill Added successfully",
											bills: addedBill
										});
										// PushController.notifyBranchMembers(tableDetails.branch_id, {
										// 	message: `new bill request on table ${tableDetails.name}`
										// }).then(result => {
										// 	PushController.notifyTableMembers(billDetails.table_id, {
										// 		message: "requested for bill",
										// 		mobile_data: "bill_requested"
										// 	}).then(result => {
										// 		console.info("Notified table users");
										// 	});
										// });
										PushController.notifyZoneMembers(tableDetails.branch_id, tableDetails.floor_id, tableDetails._id, {
											message: `new bill request on table ${tableDetails.name}`
										})
										
										PushController.notifyTableMembers(billDetails.table_id, {
											message: "requested for bill",
											mobile_data: "bill_requested"
										})
									} else {
										console.error({
											status: 0,
											message: "error adding bill",
											error: "no table found to bill"
										});
										res.status(404).json({
											status: 0,
											message: "error adding bill",
											error: "no table found"
										});
									}
								}
							);
						} else if (billDetails.takeaway_id) {
							let orderData = {
								_id: updatedOrder._id,
								branch_id: updatedOrder.branch_id,
								order_id: billDetails.takeaway_id,
								message: "order billed",
								order_status: updatedOrder.order_status
									? updatedOrder.order_status
									: "awaiting_payment"
							};

							socketController.io.sockets
								.in(updatedOrder.branch_id)
								.emit("update_order", orderData);
							socketController.io.sockets
								.in(updatedOrder.branch_id)
								.emit("update_takeaway", orderData);
							socketController.io.sockets
								.in(billDetails.takeaway_id)
								.emit("update_takeaway", orderData);

							res.status(201).json({
								status: 1,
								message: "Bill Added successfully",
								bills: addedBill
							});
							PushController.notifyBranchMembers(updatedOrder.branch_id, {
								message: `bill request for order ${billDetails.takeaway_id}`
							}).then(result => {
								console.info("Notified Branch members");
								PushController.notifyOrderMembers(billDetails.takeaway_id, {
									message: "requested for bill",
									mobile_data: "bill_requested"
								}).then(result => {
									console.info("Notified table users");
								});
							});
						} else {
							res.status(201).json({
								status: 1,
								message: "Bill Added successfully",
								bills: addedBill
							});
						}
					}
				}
			);
		}
	});
};

exports.addBill = (req, res) => {
	console.log('Adding Bill=================');
	//NOTE: this action takes place only for split by item type bill
	let billDetails = req.body.bill_details;

	billDetails["company_id"] = req.companyId;
	billDetails["branch_id"] = req.branchId || billDetails.branch_id;

	let bill = new Bill(billDetails);
	bill.save((err, addedBill) => {
		if (err) {
			console.error({
				status: 0,
				message: "Error adding bills",
				error: err
			});
			res.status(500).json({
				status: 0,
				message: "Error adding bills",
				error: "problem with the server"
			});
		} else {
			Orders.findOneAndUpdate(
				{ _id: addedBill.order_id },
				{ $set: { order_status: "awaiting_payment", bill_id: addedBill._id } },
				{ new: true },
				(err, updatedOrder) => {
					if (err) {
						console.error({
							status: 0,
							message: "Error adding bill",
							error: err
						});
						res.status(404).json({
							status: 0,
							message: "Error adding bill",
							error: "Problwm with the server"
						});
					} else {
						if (billDetails.table_id) {
							Tables.findOne(
								{ _id: billDetails.table_id },
								(err, tableDetails) => {
									if (err) {
										console.error({
											status: 0,
											message: "error adding bill",
											error: err
										});
										res.status(500).json({
											status: 0,
											message: "error adding bill",
											error: "problem with the server"
										});
									} else if (tableDetails) {
										res.status(201).json({
											status: 1,
											message: "Bill Added successfully",
											bills: addedBill
										});

										let tableData = {
											table_id: billDetails.table_id,
											floor_id: tableDetails.floor_id,
											branch_id: tableDetails.branch_id,
											// message: "order billed",
											// socket_data: 'bill_requested'
										};

										let orderData = {
											_id: updatedOrder._id,
											order_type: updatedOrder.order_type,
											table_id: updatedOrder.table_id,
											branch_id: updatedOrder.branch_id,
											order_status: updatedOrder.order_status ? updatedOrder.order_status : "awaiting_payment",
											// message: "order billed",
											// socket_data: "bill_split_item"
										};

										if(addedBill.bill_type !== 'split_by_item') {
											socketController.io.sockets.in(updatedOrder.branch_id).emit("update_table", tableData);
											socketController.io.sockets.in(updatedOrder.branch_id).emit("update_order", orderData);
										}

										// socketController.io.sockets.in(billDetails.table_id).emit("update_table", tableData);

										/**
										 * Mobile User notification to let them know the table has been billed
										 */
										// socketController.io.sockets.in(billDetails.table_id).emit("update_table", tableData);
										socketController.io.sockets.in(billDetails.table_id).emit("update_table", orderData);

										// PushController.notifyBranchMembers(updatedOrder.branch_id, {
										// 	message: `new bill request on table ${tableDetails.name}`
										// })
										PushController.notifyZoneMembers(updatedOrder.branch_id, tableDetails.floor_id, tableDetails._id, {
											message: `new bill request on table ${tableDetails.name}`
										})
										PushController.notifyTableMembers(billDetails.table_id, {
											message: "requested for bill",
											mobile_data: "bill_requested"
										})
									} else {
										console.error({
											status: 0,
											message: "error adding bill",
											error: "no table found to bill"
										});
										res.status(404).json({
											status: 0,
											message: "error adding bill",
											error: "no table found"
										});
									}
								}
							);
						} else if (billDetails.takeaway_id) {
							res.status(201).json({
								status: 1,
								message: "Bill Added successfully",
								bills: addedBill
							});
							let orderData = {
								_id: updatedOrder._id,
								order_id: billDetails.takeaway_id,
								branch_id: billDetails.branch_id,
								message: "order billed",
								order_status: updatedOrder.order_status ? updatedOrder.order_status : "awaiting_payment"
							};

							socketController.io.sockets.in(updatedOrder.branch_id).emit("update_order", orderData);
							socketController.io.sockets.in(updatedOrder.branch_id).emit("update_takeaway", orderData);
							// socketController.io.sockets.in(billDetails.takeaway_id).emit("update_takeaway", orderData);

							PushController.notifyZoneMembers(updatedOrder.branch_id, {
								message: `bill request for order ${billDetails.takeaway_id}`
							})
							PushController.notifyOrderMembers(billDetails.takeaway_id, {
								message: "requested for bill",
								mobile_data: "bill_requested"
							})
						} else {
							res.status(201).json({
								status: 1,
								message: "Bill Added successfully",
								bills: addedBill
							});
						}
					}
				}
			);
		}
	});
};

/**
 * Add And delete Bill
 */
exports.updateBill = (req, res) => {
	console.log('Updating Bill=================');

	let billData = req.body.bill_details;
	// let tableId = "";
	let branchId;
	let paramId;
	let query1;
	let query2;

	// Note the below loop will set the tableid and branchid parameters based on their roles
	if (req.accessType === "superadmin" || req.accessType === "admin" || req.accessType === 'staffs') {
		// tableId = req.body.table_id;
		if (req.body.table_id) {
			paramId = req.body.table_id;
			query1 = { table_id: paramId };
			query2 = { table_id: paramId };
		} else if (req.body.order_id) {
			paramId = req.body.order_id; // TODO: need to change this as takeaway_id
			// paramId = req.body.order_id;
			query1 = { takeaway_id: paramId };
			query2 = { order_id: paramId };
		} else if (req.body.delivery_id) {
			paramId = req.body.delivery_id;
			query1 = { delivery_id: paramId };
			query2 = { delivery_id: paramId };
		}
		if (req.body.branch_id) {
			branchId = req.body.branch_id;
			billUpdate();
		} else {
			res.status(404).json({
				status: 0,
				message: "Please Pass branchId"
			});
		}
	} else if (req.accessType === "guest") {
		/** 
		 * This portion is not is use currently, the customers don't have the previlege to update the bill in any chance
		 */
		if (req.tableId) {
			paramId = req.tableId;
			query1 = { table_id: paramId };
			query2 = { table_id: paramId };
		} else if (req.orderId) {
			//replaced reqOrderId with parameter
			paramId = req.orderId; //Here the guest orderId is the takeaway Id
			query1 = { takeaway_id: paramId };
			query2 = { order_id: paramId };
		} else if (req.deliveryId) {
			paramId = req.deliveryId;
			query1 = { delivery_id: paramId };
			query2 = { delivery_id: paramId };
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
			// tableId = req.tableId;
			billUpdate();
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

	async function billUpdate() {
		Bill.findOne(query1, (err, bills) => {
			if (err) {
				console.error({
					status: 0,
					message: "Error getting Bill",
					error: err
				});
				res.status(502).json({
					status: 0,
					message: "Error getting bill",
					error: "Problem with the server"
				});
			} else if (!bills) {
				let bill = new Bill(billData);
				bill["branch_id"] = branchId;
				bill["biller_details"] = {}
				if (req.accessType === "guest") {
					bill["biller_details"]['biller_id'] = req.userId;
					bill["biller_details"]['biller_name'] = req.userName;
					bill["biller_details"]['initiated_by_customer'] = true;
					bill["biller_details"]['biller_position'] = 'customer';

					if (req.tableId) {
						bill["table_id"] = req.tableId;
					} else if (req.orderId) {
						bill["takeaway_id"] = req.orderId;
					}
				} else if (req.accessType === "superadmin" || req.accessType === "admin" || req.accessType === 'staffs') {
					if (req.body.table_id) {
						bill["table_id"] = req.body.table_id;
					} else if (req.body.order_id) {
						bill["takeaway_id"] = req.body.order_id;
					} else if (req.body.delivery_id) {
						bill["delivery_id"] = req.body.delivery_id;
					}

					bill["biller_details"]['biller_id'] = req.userId;
					bill["biller_details"]['biller_name'] = req.userName;
					bill["biller_details"]['initiated_by_customer'] = false;
					bill["biller_details"]['biller_position'] = req.position;
				}
				// bill['table_id'] = tableId;
				// include company id also

				Orders.findOne(query2, (err, orderDetails) => {
					if (err) {
						console.error({
							status: 0,
							message: "Error getting Order details",
							error: err
						});
						res.status(500).json({
							status: 0,
							message: "Error getting Order details",
							error: "Problem with the server"
						});
					} else if (!orderDetails) {
						console.error({
							status: 0,
							message: "No Order Found for the table",
							error: "Please check the paramters"
						});
						res.status(404).json({
							status: 0,
							message: "No Orders Found For the table",
							error: "Please check the paramters"
						});
					} else {
						let inCompletedOrders = orderDetails.order_list.filter(order => {
							return order.order_status === "placed";
						});

						if (inCompletedOrders.length) {
							console.error({
								status: 0,
								message: "Your items are in progress",
								error: "Order is in progress"
							});
							res.status(400).json({
								status: 0,
								message: "Please make sure all items are confirmed",
								error: "Your items are in progress"
							});
						} else {
							bill["order_id"] = orderDetails._id;
							if (billData.bill_type === "total") {
								bill["bill_count"] = 1;
								bill["bill_type"] = billData.bill_type;
								let itemBill = [];

								// let orderDiscount;
								// if (orderDetails.order_discount && orderDetails.order_discount.discount_number) {
								// 	orderDiscount = orderDetails.order_discount / bill["bill_count"];
								// } else {
								// 	orderDiscount = 0;
								// }


								orderDetails.order_list.map(order => {
									return order.item_details.forEach(item => {
										// let temp_obj = {
										// 	name: item.name,
										// 	selling_price: item.selling_price,
										// 	sold_price: item.sold_price,
										// 	// bill_discount: item.sold_price - orderDiscount,
										// 	bill_discount: item.sold_price,
										// 	quantity: item.quantity,
										// 	addons: []
										// };
										// if (item.applied_addons.length) {
										// 	item.applied_addons.forEach(addon => {
										// 		let temp_addons = {
										// 			addon_heading: addon.heading,
										// 			addon_name: addon.name,
										// 			addon_price: addon.price,
										// 			addon_quantity: 1
										// 		};
										// 		temp_obj.addons.push(temp_addons);
										// 	});
										// }

										// [
										// 	{
										// 		// "discount_applied" : true,
										// 		// "discount_detail" : {
										// 		// 	"_id" : ObjectId("5fb3614b5e51b9268070db30"),
										// 		// 	"discount_reason" : "Owner's Friend",
										// 		// 	"discount_type" : "amount",
										// 		// 	"discount_number" : 50
										// 		// },
										// 		// "item_status" : "active",
										// 		// "is_applied_tax" : false,
										// 		// "tax_rates" : [],
										// 		// "_id" : ObjectId("5fb2201b6036ea2c103a13d0"),
										// 		// "selling_price" : 270,
										// 		// "category_id" : "5def26c742dfcc071644ad93",
										// 		// "name" : "Popcorn Rice duo",
										// 		// "food_type" : "Non Veg",
										// 		// "requests" : "",
										// 		// "applied_addons" : [],
										// 		// "sold_price" : 290,
										// 		// "quantity" : 1,
										// 		// "count" : 1,
										// 		// "item_id" : "5def328442dfcc071644b035",
										// 		// "price_before_discount" : 340
										// 	}
										// ]

										if(item.item_status !== 'removed') {
											let temp_obj = {
												name: item.name,
												skucode : item.skucode ? item.skucode: null,
												selling_price: item.selling_price,
												sold_price: item.sold_price,
												// bill_discount: item.sold_price - orderDiscount,
												bill_discount: item.sold_price,
												quantity: item.quantity,
												delquantity: item.delquantity,
												applied_addons: item.applied_addons,
												
												item_id : item.item_id,
												price_before_discount: item.price_before_discount,
												food_type : item.food_type,
												kot_order: item.kot_order,
												combo_menu: item.combo_menu,
												item_external_status : item.item_external_status?item.item_external_status:false,
												requests: item.requests,
												tax_rates : item.tax_rates ? item.tax_rates : [],
												discount_applied : item.discount_applied,
												discount_detail : item.discount_detail,
												item_status : item.item_status,
												is_applied_tax : item.is_applied_tax,
												category_id : item.category_id
											};

											itemBill.push(temp_obj);

										}


									
										// if (item.applied_addons.length) {
										// 	item.applied_addons.forEach(addon => {
										// 		let temp_addons = {
										// 			addon_heading: addon.heading,
										// 			addon_name: addon.name,
										// 			addon_price: addon.price,
										// 			addon_quantity: 1
										// 		};
										// 		temp_obj.addons.push(temp_addons);
										// 	});
										// }
									});
								});

								bill["bills"] = [];

								let bill_cost = itemBill
									.map(item => {
										return Number(item.bill_discount) * Number(item.quantity);
									})
									.reduce((a, b) => a + b,  0);

								let bill_cost_after_dicount = bill_cost;

								if(orderDetails.order_discount && orderDetails.order_discount.discount_type) {
									if(orderDetails.order_discount.discount_type === "amount") {
										let discount_amount = orderDetails.order_discount.discount_number;
										// let updated_amount = Number(orderDetails.total_cost) - (selectedItemList.item_details[0].sold_price * selectedItemList.item_details[0].quantity);
										// order_price = updated_amount > 0 ? updated_amount - discount_amount : 0;
										bill_cost_after_dicount = bill_cost - discount_amount;
									} else if(orderDetails.order_discount.discount_type === "percentage") {
										// let discount_amount = orderDetails.order_discount.discount_number;
										// let updated_amount = bill_cost - (bill_cost * (orderDetails.order_discount.discount_number/100));
										bill_cost_after_dicount = bill_cost - (bill_cost * (orderDetails.order_discount.discount_number / 100));
										// order_price = updated_amount > 0 ? updated_amount - (discount_amount / 100) * updated_amount : 0;
									} else if (orderDetails.order_discount.discount_type === "new_value") {
										// order_price = orderDetails.order_discount.discount_number;
										bill_cost_after_dicount = orderDetails.order_discount.discount_number;
									} else if (orderDetails.order_discount.discount_type === "flat") {
										// order_price = 0;
										bill_cost_after_dicount = 0;
									}
								}

								/**
								 * Find Tax details
								 */
								let item_details_array = orderDetails.order_list.map((order) => order.item_details);
								let all_item_list = item_details_array.flat(Infinity);
								let tax_rates = all_item_list.map((item) => {
									
										let new_tax_rates = item.tax_rates.filter((tax) => {
											if(item.item_status != 'removed') {
											if (tax.checked == true) {
												tax.item_price = item.sold_price * item.quantity;
												// tax.item_gst_price = (item.sold_price * item.quantity) * (tax.percentage / 100);
												if(item.sold_price === 0 && bill_cost === 0) {
													tax.item_gst_price = 0;
												} else{
													tax.item_gst_price = (((item.sold_price/bill_cost) * (bill_cost_after_dicount)) * item.quantity) * (tax.percentage / 100);
												}
												return tax
											} else {
												return false
											}
										}
										})
										return new_tax_rates;
									
								}).filter((x) => x);
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
								if(bill_taxes_details.length) {
									total_bill_tax_cost = bill_taxes_details
										.map(tax => {
											return tax.item_gst_price;
										})
										.reduce((a, b) => a + b, 0);
								}

								let bill_service_charge = 0;
								if(orderDetails.order_discount && orderDetails.order_discount.discount_type === 'flat') {
									bill_cost = 0;
								}
								if(bill["table_id"] && billData['service_charge_percentage']) {

									let order_price = bill_cost;
									if (orderDetails.order_discount && orderDetails.order_discount.discount_type) {
										if(orderDetails.order_discount.discount_type === "amount") {
											let discount_amount = orderDetails.order_discount.discount_number;
											// let updated_amount = Number(orderDetails.total_cost) - (selectedItemList.item_details[0].sold_price * selectedItemList.item_details[0].quantity);
											// order_price = updated_amount > 0 ? updated_amount - discount_amount : 0;
											order_price = bill_cost - discount_amount;
										} else if(orderDetails.order_discount.discount_type === "percentage") {
											let discount_amount = orderDetails.order_discount.discount_number;
											// let updated_amount = bill_cost - (bill_cost * (orderDetails.order_discount.discount_number/100));
											order_price = bill_cost - (bill_cost * (orderDetails.order_discount.discount_number/100));
											// order_price = updated_amount > 0 ? updated_amount - (discount_amount / 100) * updated_amount : 0;
										} else if (orderDetails.order_discount.discount_type === "new_value") {
											// order_price = orderDetails.order_discount.discount_number;
											order_price = orderDetails.order_discount.discount_number;
										} else if (orderDetails.order_discount.discount_type === "flat") {
											order_price = 0;
										}
									} else {
										// order_price = Number(billData.total_cost) - (selectedItemList.item_details[0].sold_price * selectedItemList.item_details[0].quantity);
									}

									// bill.bill_final_cost - (bill_details?.order_discount?.discount_number ? (bill_details.order_discount.discount_number / bill_details.bill_count)

									bill_service_charge = ((order_price) * (billData['service_charge_percentage']/100))
								}

								bill_cost = bill_cost_after_dicount;

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

									if(bill["table_id"] && billData['service_charge_percentage']) {
										structured_bill['service_charge_percentage']= billData['service_charge_percentage'];
										structured_bill['service_charge_amount']= bill_service_charge;
									}
									bill["bills"].push(structured_bill);
								}
								bill["bills"].forEach(bill => {
									bill["item_list"] = itemBill;
								});

								bill.save((err, savedBill) => {
									if (err) {
										console.error({
											status: 0,
											message: "Error Saving Bill",
											error: err
										});
										res.status(500).json({
											status: 0,
											message: "Error Saving Bill",
											error: "Problem with the server"
										});
									} else {
										Orders.findOneAndUpdate(
											{ _id: orderDetails._id },
											{ $set: { order_status: "awaiting_payment", bill_id: savedBill._id } },
											(err, updatedOrder) => {
												if (err) {
													console.error({
														status: 0,
														message: "Error adding bill",
														error: err
													});
													res.status(404).json({
														status: 0,
														message: "Error adding bill",
														error: "Problem with the server"
													});
												} else {
													res.status(201).json({
														status: 1,
														message: "Bill Added successfully",
														bills: savedBill
													});

													if(savedBill.table_id) {
														let tableData = {
															table_id: updatedOrder.table_id,
															floor_id: updatedOrder.floor_id,
															branch_id: updatedOrder.branch_id,
															message: "order billed",
															socket_data: "bill_requested",
															requestor_details: savedBill.biller_details
														};
														let orderData = {
															_id: updatedOrder._id,
															order_type: updatedOrder.order_type,
															table_id: updatedOrder.table_id,
															branch_id: updatedOrder.branch_id,
															order_status: updatedOrder.order_status ? updatedOrder.order_status : "awaiting_payment",
															message: "order billed"
														};

														if(req.accessType === 'guest') {
															Tables.findOneAndUpdate({ _id: savedBill.table_id }, { $set: { table_order_status: 'bill_request', has_alert: true } }, { new : true}, (err, tableResult) => {
																if(err) {
																	console.error('Error updating table =>', err)
																}else{
																	tableData.floor_id = tableResult.floor_id;
																	socketController.io.sockets.in(updatedOrder.branch_id).emit("update_table", tableData);
																	socketController.io.sockets.in(updatedOrder.branch_id).emit("update_order", orderData);
																	// socketController.io.sockets.in(savedBill.table_id).emit("update_table", tableData);

																	/**
																	 * Mobile User Socket for users in table (bill_requested)
																	 */
																	socketController.io.sockets.in(savedBill.table_id).emit("update_table", tableData);

																	PushController.notifyZoneMembers(updatedOrder.branch_id, tableResult.floor_id, tableResult._id, {
																		message: `new table bill request`
																	})
																	
																	PushController.notifyTableMembers(savedBill.table_id, {
																		message: "requested for bill",
																		mobile_data: "bill_requested"
																	})
																}
															})
														}else{
															socketController.io.sockets.in(updatedOrder.branch_id).emit("update_table", tableData);
															socketController.io.sockets.in(updatedOrder.branch_id).emit("update_order", orderData);
															// socketController.io.sockets.in(savedBill.table_id).emit("update_table", tableData);

															/**
															 * Mobile User Socket for users in table (bill_requested)
															 */
															socketController.io.sockets.in(savedBill.table_id).emit("update_table", tableData);

															// PushController.notifyBranchMembers(updatedOrder.branch_id, {
															// 	message: `new table bill request`
															// })
															PushController.notifyZoneMembers(updatedOrder.branch_id,updatedOrder.floor_id, updatedOrder.table_id, {
																message: `new table bill request`
															})
															
															PushController.notifyTableMembers(savedBill.table_id, {
																message: "requested for bill",
																mobile_data: "bill_requested"
															})
														}
														
													}else if(savedBill.takeaway_id) {
														let orderData = {
															_id: updatedOrder._id,
															order_type: updatedOrder.order_type,
															order_id: updatedOrder.order_id,
															branch_id: updatedOrder.branch_id,
															order_status: updatedOrder.order_status ? updatedOrder.order_status : "awaiting_payment",
															message: "order billed",
															socket_data: 'bill_requested',
															requestor_details: savedBill.biller_details
														};
														socketController.io.sockets.in(updatedOrder.branch_id).emit("update_order", orderData);
														socketController.io.sockets.in(updatedOrder.branch_id).emit("update_takeaway", orderData);
														// socketController.io.sockets.in(savedBill.takeaway_id).emit("update_takeaway", orderData);

														/**
														 * Mobile User Socket for users in table (bill_requested)
														 */
														socketController.io.sockets.in(savedBill.takeaway_id).emit("update_takeaway", orderData);
														
														PushController.notifyBranchMembers(updatedOrder.branch_id, {
															message: `bill request for order ${savedBill.takeaway_id}`
														})
														
														PushController.notifyOrderMembers(savedBill.takeaway_id, {
															message: "requested for bill",
															mobile_data: "bill_requested"
														})
													}
												}
											}
										);
									}
								});
							} else if (billData.bill_type === "split_equal") {
								bill["bill_count"] = billData.bill_count;
								bill["bill_type"] = billData.bill_type;
								let itemBill = [];

								orderDetails.order_list.map(order => {
									return order.item_details.forEach(item => {
										// let temp_obj = {
										// 	name: item.name,
										// 	selling_price: item.selling_price,
										// 	sold_price: item.sold_price,
										// 	quantity: item.quantity,
										// 	addons: []
										// };
										// if (item.applied_addons.length) {
										// 	item.applied_addons.forEach(addon => {
										// 		let temp_addons = {
										// 			addon_heading: addon.heading,
										// 			addon_name: addon.name,
										// 			addon_price: addon.price,
										// 			addon_quantity: 1
										// 		};
										// 		temp_obj.addons.push(temp_addons);
										// 	});
										// }

										if(item.item_status !== 'removed') {
											let temp_obj = {
												name: item.name,
												skucode : item.skucode ? item.skucode: null,
												selling_price: item.selling_price,
												sold_price: item.sold_price,
												// bill_discount: item.sold_price - orderDiscount,
												bill_discount: item.sold_price,
												quantity: item.quantity,
												delquantity: item.delquantity,
												applied_addons: item.applied_addons,
												
												item_id : item.item_id,
												price_before_discount: item.price_before_discount,
												food_type : item.food_type,
												kot_order: item.kot_order,
												combo_menu: item.combo_menu,
												item_external_status : item.item_external_status?item.item_external_status:false,
												requests: item.requests,
												tax_rates : item.tax_rates ? item.tax_rates : [],
												discount_applied : item.discount_applied,
												discount_detail : item.discount_detail,
												item_status : item.item_status,
												is_applied_tax : item.is_applied_tax,
												category_id : item.category_id
											};

											itemBill.push(temp_obj);
										}
									});
								});

								bill["bills"] = [];

								let bill_cost = itemBill
								.map(item => {
									return item.sold_price * item.quantity;
								})
								.reduce((a, b) => a + b);

								let bill_cost_after_dicount = bill_cost;

								// if(billData.item_discounts && billData.item_discounts.discounted_items.length) {
								// 	bill_cost = bill_cost - billData.item_discounts.total_discount;
								// }


								if(orderDetails.order_discount && orderDetails.order_discount.discount_type) {
									if(orderDetails.order_discount.discount_type === "amount") {
										let discount_amount = orderDetails.order_discount.discount_number;
										// let updated_amount = Number(billData.total_cost) - (selectedItemList.item_details[0].sold_price * selectedItemList.item_details[0].quantity);
										// order_price = updated_amount > 0 ? updated_amount - discount_amount : 0;
										bill_cost_after_dicount = bill_cost - discount_amount;
									} else if(orderDetails.order_discount.discount_type === "percentage") {
										let discount_amount = orderDetails.order_discount.discount_number;
										// let updated_amount = bill_cost - (bill_cost * (orderDetails.order_discount.discount_number/100));
										bill_cost_after_dicount = bill_cost - (bill_cost * (orderDetails.order_discount.discount_number / 100));
										// order_price = updated_amount > 0 ? updated_amount - (discount_amount / 100) * updated_amount : 0;
									} else if (orderDetails.order_discount.discount_type === "new_value") {
										// order_price = orderDetails.order_discount.discount_number;
										bill_cost_after_dicount = orderDetails.order_discount.discount_number;
									} else if (orderDetails.order_discount.discount_type === "flat") {
										// order_price = 0;
										bill_cost_after_dicount = 0;
									}
								}
								/**
								 * Find Tax details
								 */
								let item_details_array = orderDetails.order_list.map((order) => order.item_details);
								let all_item_list = item_details_array.flat(Infinity);
								let tax_rates = all_item_list.map((item) => {
									if(item.item_status !== 'removed') {
										let new_tax_rates = item.tax_rates.filter((tax) => {
											if (tax.checked == true) {
												tax.item_price = item.sold_price * item.quantity;
												// tax.item_gst_price = ((item.sold_price * item.quantity) * (tax.percentage / 100)) / bill["bill_count"];
												if(item.sold_price === 0 && bill_cost === 0) {
													tax.item_gst_price = 0;
												} else{
													tax.item_gst_price = ( ( ( (item.sold_price/bill_cost) * (bill_cost_after_dicount) ) * item.quantity ) * (tax.percentage / 100) ) / bill["bill_count"];
												}
												return tax
											} else {
												return false
											}
										})
										return new_tax_rates;
									}
								}).filter((x) => x);
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
								if(bill_taxes_details.length) {
									total_bill_tax_cost = bill_taxes_details
									.map(tax => {
										return tax.item_gst_price;
									})
									.reduce((a, b) => a + b);
								}

								let bill_service_charge = 0;
								if(orderDetails.order_discount && orderDetails.order_discount.discount_type === 'flat') {
									bill_cost = 0;
								}

								if(bill["table_id"] && billData['service_charge_percentage']) {

									let order_price = bill_cost;
									if (billData.order_discount && billData.order_discount.discount_type) {
										if(billData.order_discount.discount_type === "amount") {
											let discount_amount = billData.order_discount.discount_number;
											// let updated_amount = Number(billData.total_cost) - (selectedItemList.item_details[0].sold_price * selectedItemList.item_details[0].quantity);
											// order_price = updated_amount > 0 ? updated_amount - discount_amount : 0;
											order_price = bill_cost - discount_amount;
										} else if(billData.order_discount.discount_type === "percentage") {
											let discount_amount = billData.order_discount.discount_number;
											// let updated_amount = bill_cost - (bill_cost * (billData.order_discount.discount_number/100));
											order_price = bill_cost - (bill_cost * (billData.order_discount.discount_number/100));
											// order_price = updated_amount > 0 ? updated_amount - (discount_amount / 100) * updated_amount : 0;
										} else if (billData.order_discount.discount_type === "new_value") {
											// order_price = billData.order_discount.discount_number;
											order_price = billData.order_discount.discount_number;
										} else if (billData.order_discount.discount_type === "flat") {
											order_price = 0;
										}
									} else {
										// order_price = Number(billData.total_cost) - (selectedItemList.item_details[0].sold_price * selectedItemList.item_details[0].quantity);
									}

									// bill.bill_final_cost - (bill_details?.order_discount?.discount_number ? (bill_details.order_discount.discount_number / bill_details.bill_count)
									// bill_service_charge = ((order_price) * (billData['service_charge_percentage']/100))

									bill_service_charge = ( ((order_price / bill["bill_count"]) * (billData['service_charge_percentage']/100) ) )
									
									// bill_service_charge = ( (((bill_cost / bill["bill_count"])) * (billData['service_charge_percentage']/100) ) )
								}
								bill_cost = bill_cost_after_dicount;

								for (let i = 0; i < bill["bill_count"]; i++) {
									let structured_bill = {
										bill_status: "billed",
										bill_cost: bill_cost / bill["bill_count"],

										bill_taxes_details: bill_taxes_details, 
										bill_tax_amount: total_bill_tax_cost,
										bill_cost_incl_tax: (bill_cost / bill["bill_count"]) + total_bill_tax_cost,
										bill_final_cost: (bill_cost / bill["bill_count"]) + total_bill_tax_cost + bill_service_charge, 

										paid_at: Date.now()
									}

									if(bill["table_id"] && billData['service_charge_percentage']) {
										structured_bill['service_charge_percentage']= billData['service_charge_percentage'];
										structured_bill['service_charge_amount']= bill_service_charge;
									}

									bill["bills"].push(structured_bill);
								}
								bill["bills"].forEach(bill => {
									bill["item_list"] = itemBill;
								});

								bill.save((err, savedBill) => {
									if (err) {
										console.error({
											status: 0,
											message: "Error Saving Bill",
											error: err
										});
										res.status(500).json({
											status: 0,
											message: "Error Saving Bill",
											error: "Problem with the server"
										});
									} else {
										Orders.findOneAndUpdate(
											{ _id: orderDetails._id },
											{ $set: { order_status: "awaiting_payment", bill_id: savedBill._id } },
											(err, updatedOrder) => {
												if (err) {
													console.error({
														status: 0,
														message: "Error adding bill",
														error: err
													});
													res.status(404).json({
														status: 0,
														message: "Error adding bill",
														error: "Problwm with the server"
													});
												} else {
													res.status(201).json({
														status: 1,
														message: "Bill Added successfully",
														bills: savedBill
													});

													let tableData = {
														table_id: updatedOrder.table_id,
														branch_id: updatedOrder.branch_id,
														message: "order billed",
														socket_data : "bill_requested",
														requestor_details: savedBill.biller_details
													};

													
													if(savedBill.table_id) {
														let orderData = {
															_id: updatedOrder._id,
															order_type: updatedOrder.order_type,
															table_id: updatedOrder.table_id,
															branch_id: updatedOrder.branch_id,
															order_status: updatedOrder.order_status ? updatedOrder.order_status : "awaiting_payment",
															message: "order billed"
														};
														
														if(req.accessType === 'guest') {
															Tables.findOneAndUpdate({ _id: savedBill.table_id }, { $set: { table_order_status: 'bill_request', has_alert: true } }, { new : true}, (err, tableResult) => {
																if(err) {
																	console.error('Error updating table =>', err)
																}else{
																	tableData.floor_id = tableResult.floor_id ? tableResult.floor_id: undefined;
																	socketController.io.sockets.in(updatedOrder.branch_id).emit("update_table", tableData);
																	socketController.io.sockets.in(updatedOrder.branch_id).emit("update_order", orderData);
																	// socketController.io.sockets.in(savedBill.table_id).emit("update_table", tableData);
			
																	/**
																	 * Mobile User Socket for users in table (bill_requested)
																	 */
																	socketController.io.sockets.in(savedBill.table_id).emit("update_table", tableData);
			
																	// PushController.notifyBranchMembers(updatedOrder.branch_id, {
																	// 	message: `new table bill request`
																	// })

																	PushController.notifyZoneMembers(updatedOrder.branch_id, tableResult.floor_id,  tableResult._id, {
																		message: `new table bill request`
																	})
																	
																	PushController.notifyTableMembers(savedBill.table_id, {
																		message: "requested for bill",
																		mobile_data: "bill_requested"
																	})
																}
															})
														}else {
															socketController.io.sockets.in(updatedOrder.branch_id).emit("update_table", tableData);
															socketController.io.sockets.in(updatedOrder.branch_id).emit("update_order", orderData);
															// socketController.io.sockets.in(savedBill.table_id).emit("update_table", tableData);
	
															/**
															 * Mobile User Socket for users in table (bill_requested)
															 */
															socketController.io.sockets.in(savedBill.table_id).emit("update_table", tableData);
	
															// PushController.notifyBranchMembers(updatedOrder.branch_id, {
															// 	message: `new table bill request`
															// })
															PushController.notifyZoneMembers(updatedOrder.branch_id, updatedOrder.floor_id, updatedOrder.table_id, {
																message: `new table bill request`
															})
															PushController.notifyTableMembers(savedBill.table_id, {
																message: "requested for bill",
																mobile_data: "bill_requested"
															})
														}
													}else if(savedBill.takeaway_id) {
														let orderData = {
															_id: updatedOrder._id,
															order_type: updatedOrder.order_type,
															order_id: updatedOrder.order_id,
															branch_id: updatedOrder.branch_id,
															order_status: updatedOrder.order_status ? updatedOrder.order_status : "awaiting_payment",
															message: "order billed",
															socket_data: 'bill_requested',
															requestor_details: savedBill.biller_details
														};
														socketController.io.sockets.in(updatedOrder.branch_id).emit("update_order", orderData);
														socketController.io.sockets.in(updatedOrder.branch_id).emit("update_takeaway", orderData);
														// socketController.io.sockets.in(savedBill.takeaway_id).emit("update_takeaway", orderData);

														/**
														 * Mobile User Socket for users in table (bill_requested)
														 */
														socketController.io.sockets.in(savedBill.takeaway_id).emit("update_takeaway", orderData);

														PushController.notifyBranchMembers(updatedOrder.branch_id, {
															message: `bill request for order ${savedBill.takeaway_id}`
														})
														
														PushController.notifyOrderMembers(savedBill.takeaway_id, {
															message: "requested for bill",
															mobile_data: "bill_requested"
														})
													}
												}
											}
										);
									}
								});
							} else if (billData.bill_type === "item_split"  || billData.bill_type === "split_by_item") {
								bill["bill_count"] = billData.bill_count;
								bill["bill_type"] = billData.bill_type;

								let itemBill = [];

								bill["bills"] = [];

								let bill_cost = 0;
								let total_bill_tax_cost = 0;
								let bill_taxes_details = []

								let bill_service_charge = 0;
								// if(billData['service_charge_percentage']) {
								// 	bill_service_charge = ((bill_cost + total_bill_tax_cost) * (billData['service_charge_percentage']/100))
								// }

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

									if(bill["table_id"] && billData['service_charge_percentage']) {
										structured_bill['service_charge_percentage']= billData['service_charge_percentage'];
										structured_bill['service_charge_amount']= bill_service_charge;
									}

									bill["bills"].push(structured_bill);
								}
								bill["bills"].forEach(bill => {
									bill["item_list"] = itemBill;
								});

								bill.save((err, savedBill) => {
									if (err) {
										console.error({
											status: 0,
											message: "Error Saving Bill",
											error: err
										});
										res.status(500).json({
											status: 0,
											message: "Error Saving Bill",
											error: "Problem with the server"
										});
									} else {
										Orders.findOneAndUpdate(
											{ _id: orderDetails._id },
											{ $set: { order_status: "awaiting_payment", bill_id: savedBill._id } },
											(err, updatedOrder) => {
												if (err) {
													console.error({
														status: 0,
														message: "Error adding bill",
														error: err
													});
													res.status(404).json({
														status: 0,
														message: "Error adding bill",
														error: "Problwm with the server"
													});
												} else {
													res.status(201).json({
														status: 1,
														message: "Bill Added successfully",
														bills: savedBill
													});
													let tableData = {
														table_id: updatedOrder.table_id,
														branch_id: updatedOrder.branch_id,
														message: "bill added successfully",
														socket_data: "bill_requested",
														requestor_details: savedBill.biller_details
													};

													let orderData = {
														_id: updatedOrder._id,
														order_type: updatedOrder.order_type,
														order_id: updatedOrder.order_id,
														order_status: updatedOrder.order_status ? updatedOrder.order_status : "awaiting_payment",
														message: "order billed"
													};

													if(savedBill.table_id) {
														let orderData = {
															_id: updatedOrder._id,
															order_type: updatedOrder.order_type,
															table_id: updatedOrder.table_id,
															branch_id: updatedOrder.branch_id,
															order_status: updatedOrder.order_status ? updatedOrder.order_status : "awaiting_payment",
															message: "order billed"
														};

														if(req.accessType === 'guest') {
															Tables.findOneAndUpdate({ _id: savedBill.table_id }, { $set: { table_order_status: 'bill_request', has_alert: true } }, { new : true}, (err, tableResult) => {
																if(err) {
																	console.error('Error updating table =>', err)
																}else{
																	tableData.floor_id = tableResult.floor_id ? tableResult.floor_id: undefined;
																	socketController.io.sockets.in(updatedOrder.branch_id).emit("update_table", tableData);
																	socketController.io.sockets.in(updatedOrder.branch_id).emit("update_order", orderData);
																	// socketController.io.sockets.in(savedBill.table_id).emit("update_table", tableData);

																	/**
																	 * Mobile User Socket for users in table (bill_requested)
																	 */
																	socketController.io.sockets.in(savedBill.table_id).emit("update_table", tableData);

																	// PushController.notifyBranchMembers(updatedOrder.branch_id, {
																	// 	message: `new table bill request`
																	// })

																	PushController.notifyZoneMembers(updatedOrder.branch_id, tableResult.floor_id, tableResult._id, {
																		message: `new table bill request`
																	})
																	
																	PushController.notifyTableMembers(savedBill.table_id, {
																		message: "requested for bill",
																		mobile_data: "bill_requested"
																	})
																}
															})
														}else{
															socketController.io.sockets.in(updatedOrder.branch_id).emit("update_table", tableData);
															socketController.io.sockets.in(updatedOrder.branch_id).emit("update_order", orderData);
															// socketController.io.sockets.in(savedBill.table_id).emit("update_table", tableData);
	
															/**
															 * Mobile User Socket for users in table (bill_requested)
															 */
															socketController.io.sockets.in(savedBill.table_id).emit("update_table", tableData);
	
															// PushController.notifyBranchMembers(updatedOrder.branch_id, {
															// 	message: `new table bill request`
															// })
															PushController.notifyZoneMembers(updatedOrder.branch_id, updatedOrder.floor_id,updatedOrder.table_id, {
																message: `new table bill request`
															})
															
															PushController.notifyTableMembers(savedBill.table_id, {
																message: "requested for bill",
																mobile_data: "bill_requested"
															})
														}
													}else if(savedBill.takeaway_id) {
														let orderData = {
															_id: updatedOrder._id,
															order_type: updatedOrder.order_type,
															order_id: updatedOrder.order_id,
															branch_id: updatedOrder.branch_id,
															order_status: updatedOrder.order_status ? updatedOrder.order_status : "awaiting_payment",
															message: "order billed",
															socket_data: 'bill_requested',
															requestor_details: savedBill.biller_details
														}
														socketController.io.sockets.in(updatedOrder.branch_id).emit("update_order", orderData);
														socketController.io.sockets.in(updatedOrder.branch_id).emit("update_takeaway", orderData);
														// socketController.io.sockets.in(savedBill.takeaway_id).emit("update_takeaway", orderData);

														/**
														 * Mobile User Socket for users in table (bill_requested)
														 */
														socketController.io.sockets.in(savedBill.takeaway_id).emit("update_takeaway", orderData);

														PushController.notifyBranchMembers(updatedOrder.branch_id, {
															message: `bill request for order ${savedBill.takeaway_id}`
														})
														
														PushController.notifyOrderMembers(savedBill.takeaway_id, {
															message: "requested for bill",
															mobile_data: "bill_requested"
														})
													}
												}
											}
										);
									}
								});
							} else if (billData.bill_type === "my_share") {

								bill["bill_type"] = billData.bill_type;

								let itemBill = [];
								billData.order_discount = orderDetails.order_discount;
								bill['order_discount'] = billData.order_discount;
								orderDetails.order_list.map(order => {
									return order.item_details.forEach(item => {
										// let temp_obj = {
										// 	name: item.name,
										// 	selling_price: item.selling_price,
										// 	sold_price: item.sold_price,
										// 	quantity: item.quantity,
										// 	addons: [],
										// 	tax_rates: item.tax_rates
										// };

										let temp_obj = {
											name: item.name,
											skucode : item.skucode ? item.skucode: null,
											selling_price: item.selling_price,
											sold_price: item.sold_price,
											// bill_discount: item.sold_price - orderDiscount,
											bill_discount: item.sold_price,
											quantity: item.quantity,
											delquantity: item.delquantity,
											applied_addons: item.applied_addons,
											
											item_id : item.item_id,
											price_before_discount: item.price_before_discount,
											food_type : item.food_type,
											kot_order: item.kot_order,
											combo_menu: item.combo_menu,
											item_external_status : item.item_external_status?item.item_external_status:false,
											requests: item.requests,
											tax_rates : item.tax_rates ? item.tax_rates : [],
											discount_applied : item.discount_applied,
											discount_detail : item.discount_detail,
											item_status : item.item_status,
											is_applied_tax : item.is_applied_tax,
											category_id : item.category_id
										};


										if (orderDetails.order_type === "take_aways") {
											temp_obj.orderer_id = orderDetails.delivery_address
												.customer_id
												? orderDetails.delivery_address.customer_id
												: null;
											temp_obj.orderer_name = orderDetails.delivery_address
												.person_name
												? orderDetails.delivery_address.person_name
												: null;
										} else if (orderDetails.order_type === "in_house") {
											temp_obj.orderer_id = item.customer_id
												? item.customer_id
												: null;
											temp_obj.orderer_name = item.customer_name
												? item.customer_name
												: null;
										} else if (orderDetails.order_type === "home_delivery") {
											temp_obj.orderer_id = orderDetails.delivery_address
												.customer_id
												? orderDetails.delivery_address.customer_id
												: null;
											temp_obj.orderer_name = orderDetails.delivery_address
												.person_name
												? orderDetails.delivery_address.person_name
												: null;
										}

										// if (item.applied_addons.length) {
										// 	item.applied_addons.forEach(addon => {
										// 		let temp_addons = {
										// 			addon_heading: addon.heading,
										// 			addon_name: addon.name,
										// 			addon_price: addon.price,
										// 			addon_quantity: 1
										// 		};
										// 		temp_obj.addons.push(temp_addons);
										// 	});
										// }

										itemBill.push(temp_obj);
									});
								});

								let containNonOrdererId;
								const tableCustomers = [
										...new Set(itemBill.map(item => {
											if(!item.orderer_id) {
												containNonOrdererId = true;
											}else{
												return item.orderer_id
											}
										}
									))
								];
								if(containNonOrdererId) {
									console.error({
										status: 0,
										message: "you cannot apply your share for this table",
										error: 'not all users having orderer id'
									});
									res.status(200).json({
										status: 0,
										message: "you cannot apply your share for this table",
										error: "additional orderers available"
									});
								}else{
									bill["bill_count"] = tableCustomers.length;

									bill["bills"] = [];
	
									var spliteditem = {};
									for (var i = 0; i < itemBill.length; i++) {
										if (spliteditem[itemBill[i].orderer_id] == undefined) {
											spliteditem[itemBill[i].orderer_id] = [];
										}
										spliteditem[itemBill[i].orderer_id].push(itemBill[i]);
									}
	
									for (let i = 0; i < bill["bill_count"]; i++) {
										// let item_details_array = orderDetails.order_list.map((order) => order.item_details);
										// let all_item_list = item_details_array.flat(Infinity);


										let bill_cost = spliteditem[tableCustomers[i]]
										.map(item => item.sold_price * item.quantity)
										.reduce((a, b) => a + b)

										// let actual_amount = element.total_cost;
										// let bill_cost_after_dicount = element.total_cost;
										// if(all_bills.order_discount && all_bills.order_discount.discount_type) {
										// 	if(all_bills.order_discount.discount_type === "amount") {
										// 		// let discount_amount = all_bills.order_discount.discount_number / bill_list.length;
										// 		let discount_amount = (element.total_cost/this.orderService.selectedOrder?.total_cost) * all_bills.order_discount.discount_number
										// 		// let updated_amount = Number(all_bills.total_cost) - (selectedItemList.item_details[0].sold_price * selectedItemList.item_details[0].quantity);
										// 		// order_price = updated_amount > 0 ? updated_amount - discount_amount : 0;
										// 		bill_cost_after_dicount = actual_amount - discount_amount;
										// 	} else if(all_bills.order_discount.discount_type === "percentage") {
										// 		let discount_amount = all_bills.order_discount.discount_number;
										// 		// let updated_amount = actual_amount - (actual_amount * (all_bills.order_discount.discount_number/100));
										// 		bill_cost_after_dicount = actual_amount - (actual_amount * (all_bills.order_discount.discount_number / 100));
										// 		// order_price = updated_amount > 0 ? updated_amount - (discount_amount / 100) * updated_amount : 0;
										// 	} else if (all_bills.order_discount.discount_type === "new_value") {
										// 		// order_price = all_bills.order_discount.discount_number;

										// 		bill_cost_after_dicount = actual_amount -  (element.total_cost/this.orderService.selectedOrder?.total_cost) * (this.orderService.selectedOrder?.total_cost - all_bills.order_discount.discount_number)
										// 		// bill_cost_after_dicount = all_bills.order_discount.discount_number;
										// 	} else if (all_bills.order_discount.discount_type === "flat") {
										// 		bill_cost_after_dicount = 0;
										// 		element.total_cost = 0;
										// 	}
										// }






										let bill_cost_after_dicount = bill_cost;

										if(billData.order_discount && billData.order_discount.discount_type) {
											if(billData.order_discount.discount_type === "amount") {
												// let discount_amount = billData.order_discount.discount_number;
												// bill_cost_after_dicount = bill_cost  - discount_amount;
												let discount_amount = (bill_cost/orderDetails.total_cost) * billData.order_discount.discount_number;
												bill_cost_after_dicount = bill_cost - discount_amount;
												// let discount_amount = (element.total_cost/this.orderService.selectedOrder?.total_cost) * all_bills.order_discount.discount_number
											} else if(billData.order_discount.discount_type === "percentage") {
												let discount_amount = billData.order_discount.discount_number;
												// bill_cost_after_dicount = bill_cost - (bill_cost * (billData.order_discount.discount_number / 100));
												bill_cost_after_dicount = bill_cost - (bill_cost * (billData.order_discount.discount_number / 100));
											} else if (billData.order_discount.discount_type === "new_value") {
												// bill_cost_after_dicount = billData.order_discount.discount_number;
												bill_cost_after_dicount = bill_cost - (bill_cost/orderDetails.total_cost) * (orderDetails.total_cost - billData.order_discount.discount_number);
												// bill_cost_after_dicount = actual_amount -  (element.total_cost/this.orderService.selectedOrder?.total_cost) * (this.orderService.selectedOrder?.total_cost - all_bills.order_discount.discount_number)

											} else if (billData.order_discount.discount_type === "flat") {
												// order_price = 0;
												bill_cost_after_dicount = 0;
											}
										}

										// if(billData.order_discount && billData.order_discount.discount_type) {
										// 	if(billData.order_discount.discount_type === "amount") {
										// 		let discount_amount = billData.order_discount.discount_number;
										// 		// let updated_amount = Number(billData.total_cost) - (selectedItemList.item_details[0].sold_price * selectedItemList.item_details[0].quantity);
										// 		// order_price = updated_amount > 0 ? updated_amount - discount_amount : 0;
										// 		bill_cost_after_dicount = bill_cost - discount_amount;
										// 	} else if(billData.order_discount.discount_type === "percentage") {
										// 		let discount_amount = billData.order_discount.discount_number;
										// 		// let updated_amount = bill_cost - (bill_cost * (billData.order_discount.discount_number/100));
										// 		bill_cost_after_dicount = bill_cost - (bill_cost * (billData.order_discount.discount_number / 100));
										// 		// order_price = updated_amount > 0 ? updated_amount - (discount_amount / 100) * updated_amount : 0;
										// 	} else if (billData.order_discount.discount_type === "new_value") {
										// 		// order_price = billData.order_discount.discount_number;
										// 		bill_cost_after_dicount = billData.order_discount.discount_number;
										// 	} else if (billData.order_discount.discount_type === "flat") {
										// 		// order_price = 0;
										// 	}
										// }


										let tax_rates = spliteditem[tableCustomers[i]].map((item) => {

											let new_tax_rates = item.tax_rates.filter((tax) => {
											if(item.item_status != 'removed') {
												if (tax.checked == true) {
													tax.item_price = item.sold_price * item.quantity;
													// tax.item_gst_price = (item.sold_price * item.quantity) * (tax.percentage / 100);
													// tax.item_gst_price = (((item.sold_price/bill_cost) * (bill_cost_after_dicount)) * item.quantity) * (tax.percentage / 100);
													if(item.sold_price === 0 && bill_cost === 0) {
														tax.item_gst_price = 0;
													} else{
														tax.item_gst_price = (((item.sold_price/bill_cost) * (bill_cost_after_dicount)) * item.quantity) * (tax.percentage / 100);
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
										if(bill_taxes_details.length) {
											total_bill_tax_cost = bill_taxes_details
												.map(tax => {
													return tax.item_gst_price;
												})
												.reduce((a, b) => a + b);
										}

										let bill_service_charge = 0;
										if(billData.order_discount && billData.order_discount.discount_type === 'flat') {
											bill_cost = 0;
										}
										if(bill["table_id"] && billData['service_charge_percentage']) {
											let order_price = bill_cost;
											// if (billData.order_discount && billData.order_discount.discount_type) {
											// 	if(billData.order_discount.discount_type === "amount") {
											// 		let discount_amount = billData.order_discount.discount_number;
											// 		// let updated_amount = Number(billData.total_cost) - (selectedItemList.item_details[0].sold_price * selectedItemList.item_details[0].quantity);
											// 		// order_price = updated_amount > 0 ? updated_amount - discount_amount : 0;
											// 		order_price = bill_cost - discount_amount;
											// 	} else if(billData.order_discount.discount_type === "percentage") {
											// 		let discount_amount = billData.order_discount.discount_number;
											// 		// let updated_amount = bill_cost - (bill_cost * (billData.order_discount.discount_number/100));
											// 		order_price = bill_cost - (bill_cost * (billData.order_discount.discount_number/100));
											// 		// order_price = updated_amount > 0 ? updated_amount - (discount_amount / 100) * updated_amount : 0;
											// 	} else if (billData.order_discount.discount_type === "new_value") {
											// 		// order_price = billData.order_discount.discount_number;
											// 		order_price = billData.order_discount.discount_number;
											// 	} else if (billData.order_discount.discount_type === "flat") {
											// 		// order_price = 0;
											// 	}
											// } else {
											// 	// order_price = Number(billData.total_cost) - (selectedItemList.item_details[0].sold_price * selectedItemList.item_details[0].quantity);
											// 	// order_price = Number(billData.bill_cost);
											// }

											// bill_service_charge = ((bill_cost ) * (billData['service_charge_percentage']/100))
											// bill_service_charge = ((order_price) * (billData['service_charge_percentage']/100))
											bill_service_charge = ((bill_cost_after_dicount) * (billData['service_charge_percentage']/100))
										}

										let structured_bill = {
											bill_status: "billed",
											bill_cost: bill_cost,

											bill_taxes_details: bill_taxes_details, 
											bill_tax_amount: total_bill_tax_cost, 
											bill_cost_incl_tax: bill_cost + total_bill_tax_cost,
											bill_final_cost: bill_cost + total_bill_tax_cost + bill_service_charge,

											paid_at: Date.now(),
											orderer_id: tableCustomers[i],
											orderer_name: spliteditem[tableCustomers[i]][0].orderer_name
												? spliteditem[tableCustomers[i]][0].orderer_name
												: "Others",
											item_list: spliteditem[tableCustomers[i]]
										}

										if(bill["table_id"] && billData['service_charge_percentage']) {
											structured_bill['service_charge_percentage']= billData['service_charge_percentage'];
											structured_bill['service_charge_amount']= bill_service_charge;
										}

										bill["bills"].push(structured_bill);
									}
	
									bill.save((err, savedBill) => {
										if (err) {
											console.error({
												status: 0,
												message: "Error Saving Bill",
												error: err
											});
											res.status(500).json({
												status: 0,
												message: "Error Saving Bill",
												error: "Problem with the server"
											});
										} else {
											Orders.findOneAndUpdate(
												{ _id: orderDetails._id },
												{ $set: { order_status: "awaiting_payment", bill_id: savedBill._id } },
												(err, updatedOrder) => {
													if (err) {
														console.error({
															status: 0,
															message: "Error adding bill",
															error: err
														});
														res.status(404).json({
															status: 0,
															message: "Error adding bill",
															error: "Problwm with the server"
														});
													} else {
														res.status(201).json({
															status: 1,
															message: "Bill Added successfully",
															bills: savedBill
														});
														let tableData = {
															table_id: updatedOrder.table_id,
															branch_id: updatedOrder.branch_id,
															message: "bill added successfully",
															socket_data: 'bill_requested',
															requestor_details: savedBill.biller_details
														};
														// let orderData = {
														// 	_id: updatedOrder._id,
														// 	order_type: updatedOrder.order_type,
														// 	order_id: updatedOrder.order_id,
														// 	order_status: updatedOrder.order_status ? updatedOrder.order_status : "awaiting_payment",
														// 	message: "order billed"
														// };
	
														if(savedBill.table_id) {
															let orderData = {
																_id: updatedOrder._id,
																order_type: updatedOrder.order_type,
																table_id: updatedOrder.table_id,
																branch_id: updatedOrder.branch_id,
																order_status: updatedOrder.order_status ? updatedOrder.order_status : "awaiting_payment",
																message: "order billed"
															};
	
															if(req.accessType === 'guest') {
																Tables.findOneAndUpdate({ _id: savedBill.table_id }, { $set: { table_order_status: 'bill_request', has_alert: true } }, { new : true}, (err, tableResult) => {
																	if(err) {
																		console.error('Error updating table =>', err)
																	}else{
																		tableData.floor_id = tableResult.floor_id ? tableResult.floor_id: undefined;
																		socketController.io.sockets.in(updatedOrder.branch_id).emit("update_table", tableData);
																		socketController.io.sockets.in(updatedOrder.branch_id).emit("update_order", orderData);
																		// socketController.io.sockets.in(savedBill.table_id).emit("update_table", tableData);
	
																		/**
																		 * Mobile User Socket for users in table (bill_requested)
																		 */
																		socketController.io.sockets.in(savedBill.table_id).emit("update_table", tableData);
	
																		// PushController.notifyBranchMembers(updatedOrder.branch_id, {
																		// 	message: `new table bill request`
																		// })

																		PushController.notifyZoneMembers(updatedOrder.branch_id, tableResult.floor_id, tableResult._id, {
																			message: `new table bill request`
																		})
																		
																		PushController.notifyTableMembers(savedBill.table_id, {
																			message: "requested for bill",
																			mobile_data: "bill_requested"
																		})
																	}
																})
															}else{
																socketController.io.sockets.in(updatedOrder.branch_id).emit("update_table", tableData);
																socketController.io.sockets.in(updatedOrder.branch_id).emit("update_order", orderData);
																// socketController.io.sockets.in(savedBill.table_id).emit("update_table", tableData);
		
																/**
																 * Mobile User Socket for users in table (bill_requested)
																 */
																socketController.io.sockets.in(savedBill.table_id).emit("update_table", tableData);
		
																// PushController.notifyBranchMembers(updatedOrder.branch_id, {
																// 	message: `new table bill request`
																// })

																PushController.notifyZoneMembers(updatedOrder.branch_id, updatedOrder.floor_id, updatedOrder.table_id,{
																	message: `new table bill request`
																})
																
																PushController.notifyTableMembers(savedBill.table_id, {
																	message: "requested for bill",
																	mobile_data: "bill_requested"
																})
															}
														}else if(savedBill.takeaway_id) {
															let orderData = {
																_id: updatedOrder._id,
																order_type: updatedOrder.order_type,
																order_id: updatedOrder.order_id,
																branch_id: updatedOrder.branch_id,
																order_status: updatedOrder.order_status ? updatedOrder.order_status : "awaiting_payment",
																message: "order billed",
																socket_data: 'bill_requested',
																requestor_details: savedBill.biller_details
															};
															socketController.io.sockets.in(updatedOrder.branch_id).emit("update_order", orderData);
															socketController.io.sockets.in(updatedOrder.branch_id).emit("update_takeaway", orderData);
															// socketController.io.sockets.in(savedBill.takeaway_id).emit("update_takeaway", orderData);
	
															/**
															 * Mobile User Socket for users in table (bill_requested)
															 */
															socketController.io.sockets.in(savedBill.takeaway_id).emit("update_takeaway", orderData);
	
															PushController.notifyBranchMembers(updatedOrder.branch_id, {
																message: `bill request for order ${savedBill.takeaway_id}`
															})
															
															PushController.notifyOrderMembers(savedBill.takeaway_id, {
																message: "requested for bill",
																mobile_data: "bill_requested"
															})
														}
													}
												}
											);
										}
									});
								}
							} else {
								console.error({
									status: 0,
									message: "Invalid bill type",
									error: "Invalid Bill Type"
								});
								res.status(400).json({
									status: 0,
									message: "Invalid bill type",
									error: "Invalid Option"
								});
							}
						}
					}
				});
			} else {
				if (req.accessType === "guest") {
					console.error({
						status: 1,
						message: "Bill already placed",
						error: "Existing Bill"
					});
					res.status(200).json({
						status: 1,
						message: "Bill already placed"
					});
				} else {
					Bill.findOne({ "bills._id": billData.bill_id }, (err, bills) => {
						if (err) {
							console.error({
								status: 0,
								message: "Error finding bill",
								error: err
							});
							res.status(500).send({
								status: 0,
								message: "Error finding bill",
								error: "Problem with the server"
							});
						} else if (!bills) {
							console.error({
								status: 0,
								message: "Error finding particular bill",
								error: err
							});
							res.status(500).send({
								status: 0,
								message: "Error finding particular bill",
								error: "Please check the bill params"
							});
						} else {
							let isAllBillsConfirmed;


							// let bill_cost = billData.bill.item_list
							// .map(item => {
							// 	return item.sold_price * item.quantity;
							// })
							// .reduce((a, b) => {
							// 	return a + b;
							// });

							// let bill_cost_after_dicount = bill_cost;
							// if(billData.order_discount && billData.order_discount.discount_type) {
							// 	if(billData.order_discount.discount_type === "amount") {
							// 		let discount_amount = billData.order_discount.discount_number;
							// 		// let updated_amount = Number(billData.total_cost) - (selectedItemList.item_details[0].sold_price * selectedItemList.item_details[0].quantity);
							// 		// order_price = updated_amount > 0 ? updated_amount - discount_amount : 0;
							// 		bill_cost_after_dicount = bill_cost - discount_amount;
							// 	} else if(billData.order_discount.discount_type === "percentage") {
							// 		let discount_amount = billData.order_discount.discount_number;
							// 		// let updated_amount = bill_cost - (bill_cost * (billData.order_discount.discount_number/100));
							// 		bill_cost_after_dicount = bill_cost - (bill_cost * (billData.order_discount.discount_number / 100));
							// 		// order_price = updated_amount > 0 ? updated_amount - (discount_amount / 100) * updated_amount : 0;
							// 	} else if (billData.order_discount.discount_type === "new_value") {
							// 		// order_price = billData.order_discount.discount_number;
							// 	} else if (billData.order_discount.discount_type === "flat") {
							// 		// order_price = 0;
							// 	}
							// }

							/**
							 * Find Tax details
							 */
							// let item_details_array = orderDetails.order_list.map((order) => order.item_details);
							// let all_item_list = item_details_array.flat(Infinity);
							// let tax_rates = billData.bill.item_list.map((item) => {
							// 	let new_tax_rates = item.tax_rates.filter((tax) => {
							// 		if (tax.checked == true) {
							// 			tax.item_price = item.sold_price * item.quantity;
							// 			// tax.item_gst_price = (item.sold_price * item.quantity) * (tax.percentage / 100);
							// 			tax.item_gst_price = (((item.sold_price/bill_cost) * (bill_cost_after_dicount)) * item.quantity) * (tax.percentage / 100);
							// 			return tax
							// 		} else {
							// 			return false
							// 		}
							// 	})
							// 	return new_tax_rates;
							// });
							// let tax_rates_array = tax_rates.flat(Infinity);
							// let bill_taxes_details = [];
							// tax_rates_array.reduce(function (res, value) {
							// 	if (!res[value.tax_type]) {
							// 		res[value.tax_type] = { tax_type: value.tax_type, item_gst_price: 0, tax_percentage: value.percentage };
							// 		bill_taxes_details.push(res[value.tax_type])
							// 	}
							// 	res[value.tax_type].item_gst_price += value.item_gst_price;
							// 	return res;
							// }, {});

							/**
							 * End of finding Tax Details
							 */

							
							 let currentBill = billData.bill

							let total_bill_tax_cost = currentBill.bill_tax_amount ? currentBill.bill_tax_amount : 0;
							let bill_cost = currentBill.bill_cost ? currentBill.bill_cost : 0;
							let bill_taxes_details = currentBill.bill_taxes_details ? currentBill.bill_taxes_details : 0;
							let bill_cost_incl_tax = currentBill.bill_cost_incl_tax ? currentBill.bill_cost_incl_tax : 0;
					

							// if(bill_taxes_details.length) {
							// 	total_bill_tax_cost = bill_taxes_details
							// 		.map(tax => {
							// 			return tax.item_gst_price;
							// 		})
							// 		.reduce((a, b) => a + b);
							// }

							let bill_query;
							let order_query;
							
							if(billData.status) {
								bill_query = {
									"bills.$.item_list": billData.bill.item_list,
									"bills.$.bill_cost": Number(bill_cost),
									"bills.$.bill_status": billData.status,

									"bills.$.bill_taxes_details": bill_taxes_details, 
									"bills.$.bill_tax_amount": total_bill_tax_cost, 
									"bills.$.bill_cost_incl_tax": Number(bill_cost_incl_tax)
								};
							}else{
								bill_query = {
									"bills.$.item_list": billData.bill.item_list,
									"bills.$.bill_cost": Number(bill_cost),

									"bills.$.bill_taxes_details": bill_taxes_details, 
									"bills.$.bill_tax_amount": total_bill_tax_cost, 
									"bills.$.bill_cost_incl_tax": Number(bill_cost_incl_tax)
								};
							}

							if(bills["table_id"] && billData.bill['service_charge_percentage']) {
								bill_query["bills.$.service_charge_percentage"] = billData.bill.service_charge_percentage,
								bill_query["bills.$.service_charge_amount"] = billData.bill.service_charge_amount,
								bill_query["bills.$.bill_final_cost"] = bill_cost_incl_tax + Number(billData.bill.service_charge_amount)
							} else {
								bill_query["bills.$.bill_final_cost"] = bill_cost_incl_tax
							}

							// bkp
							// if(bills["table_id"] && billData.bill['service_charge_percentage']) {
							// 	bill_query["bills.$.service_charge_percentage"] = billData.bill.service_charge_percentage,
							// 	bill_query["bills.$.service_charge_amount"] = billData.bill.service_charge_amount,
							// 	bill_query["bills.$.bill_final_cost"] = Number(bill_cost) + Number(total_bill_tax_cost) + Number(billData.bill.service_charge_amount)
							// } else {
							// 	bill_query["bills.$.bill_final_cost"] = Number(bill_cost) + Number(total_bill_tax_cost)
							// }

							Bill.findOneAndUpdate(
								{ "bills._id": billData.bill_id },
								{
									$set: bill_query
								}, { new : true, upsert: true },
								(err, updatedBill) => {
									if (err) {
										console.error({
											status: 0,
											message: "Error Updating Bill",
											error: err
										});
										res.status(500).json({
											status: 0,
											message: "Error Updating Bill",
											error: "Problem with the server"
										});
									} else {
										if(billData.status) {
											isAllBillsConfirmed = updatedBill.bills.filter((bill) => bill.bill_status === 'billed');
											if(isAllBillsConfirmed.length) {
												order_query = { order_status: "billed" } 
											}else{
												order_query = { order_status: "awaiting_payment" } 
											}
										}else{
											order_query = { order_status: "awaiting_payment" } 
										}
										Orders.findOneAndUpdate(
											{ _id: updatedBill.order_id },
											{ $set: order_query },
											{ new: true },
											(err, updatedOrder) => {
												if (err) {
													console.error({
														status: 0,
														message: "Error adding bill",
														error: err
													});
													res.status(404).json({
														status: 0,
														message: "Error adding bill",
														error: "Problem with the server"
													});
												} else {
													res.status(201).json({
														status: 1,
														message: "Bill Added successfully",
														bills: updatedBill
													});

													let tableData = {
														table_id: updatedOrder.table_id,
														floor_id: updatedOrder.floor_id,
														branch_id: updatedOrder.branch_id,
														message: "bill added successfully",
													};
													let orderData;
													if(updatedOrder.table_id) {
														orderData = {
															branch_id: updatedOrder.branch_id,
															table_id: updatedOrder.table_id,
															message: "bill added successfully",
															order_status: updatedOrder.order_status ? updatedOrder.order_status : "awaiting_payment"
														};
													}else if(updatedOrder.takeaway_id) {
														orderData = {
															branch_id: updatedOrder.branch_id,
															order_id: updatedOrder.order_id,
															message: "bill added successfully",
															order_status: updatedOrder.order_status ? updatedOrder.order_status : "awaiting_payment"
														};
													}
													
													if(!isAllBillsConfirmed.length) {
														orderData['status'] = "bill_confirmed";
														orderData['socket_data'] = "all_bills_confirmed";
														socketController.io.sockets.in(updatedOrder.branch_id).emit("update_order", orderData);
														socketController.io.sockets.in(updatedOrder.branch_id).emit("update_table", tableData);
													}
												
													if(updatedBill.table_id) {
														if(updatedOrder.order_status === 'awaiting_payment') {
															tableData.socket_data = "all_bills_confirmed"
														}
														socketController.io.sockets.in(updatedBill.table_id).emit("update_table", tableData);
													}else if(updatedBill.takeaway_id) {
														// socketController.io.sockets.in(updatedBill.takeaway_id).emit("update_order", orderData);
														if(updatedOrder.order_status === 'awaiting_payment') {
															orderData.socket_data = "all_bills_confirmed"
														}
														socketController.io.sockets.in(updatedBill.takeaway_id).emit("update_takeaway", orderData);
													}
												}
											}
										);
									}
									// res.status(201).json({
									//     status: 1,
									//     message: 'Bill Updated Successfully',
									//     bill: updatedBill
									// })
								}
							);
						}
					});
				}
			}
		});
	}
};

exports.updateBillStatus = (req, res) => {
	let updateData = req.body.bill_details;
	if (!updateData.bill_id) {
		console.error({
			status: 0,
			message: "Please pass the bill id",
			error: "no bill id"
		});
		res.status(404).json({
			status: 0,
			message: "Please pass the bill id",
			error: "No bill Id found"
		});
	} else {
		/**
		 * Note: This will update status including paid_by detail
		 */
		Bill.findOne({ "bills._id": updateData.bill_id }, (err, bills) => {
			if (updateData.tender_type) {
				let tendertypes = "";
				updateData.tender_type.forEach(element => {
					console.log(element)
					if(tendertypes == ""){
						tendertypes	= element.type;
					}else{
						tendertypes+=" | "+element.type;
					}
					
				});

				Bill.findOneAndUpdate(
					{ "bills._id": updateData.bill_id },
					{
						$set: {
							"bills.$.bill_status": updateData.status,
							"bills.$.paid_by": tendertypes
						}
					},
					{ new: true },
					(err, updatedBill) => {
						if (err) {
							console.error({
								status: 0,
								message: "Error updating bills",
								error: err
							});
							res.status(500).json({
								status: 0,
								message: "Error updating bills",
								error: "problem with the server"
							});
						} else {
							let selectedBill = updatedBill.bills.filter((bill) => bill._id == updateData.bill_id)[0];
							let paid_bill_amount = selectedBill.bill_final_cost ? selectedBill.bill_final_cost : selectedBill.bill_cost;
							paid_bill_amount = paid_bill_amount ? paid_bill_amount : 0;
							updateData.tender_type.forEach(element => {
							FinanceLookup.update({ branch_id: updatedBill.branch_id, "tender_types.tender_type": element.type}, 
							// {  $inc: { "tender_types.$.count": 1 } }
							{  $inc: { "tender_types.$.count": 1, "tender_types.$.total_cost": element.value } }
								, (err) => {
									if(err) {
										console.error('error --------', err)
									}
								}
							);

						
							//payment history
							let payment_data = {
								branch_id: updatedBill.branch_id
								, company_id: req.companyId
								, payment_type: element.type
								, amount_paid : element.value
								, paid_at: Date.now()
								, bill_id : updateData.bill_id
								, payment_status: updateData.status
							}

							let payment_history = new PaymentHistory(payment_data);
							payment_history.save().then().catch((err) => {
								console.error('error -------', err)
							});
						});
						
							// Action updated only if all bills are paid
							// let confirmedBills = updatedBill.bills.filter(bill => {
							// 	if (bill.bill_status == "confirmed" || bill.bill_status == "paid" ) {
							// 		return bill;
							// 	}
							// });

							let paidBills = updatedBill.bills.filter(bill => {
								if (bill.bill_status == "paid" ) {
									return bill;
								}
							});

							// if (confirmedBills.length !== updatedBill.bills.length) {
							if (paidBills.length !== updatedBill.bills.length) {
								if(updatedBill.table_id) {
									// let tableData = {
									// 	_id: updatedBill.table_id ? updatedBill.table_id : null,
									// 	floor_id: updatedBill.table_id ? updatedBill.table_id : null,
									// 	table_id: updatedBill.table_id ? updatedBill.table_id : null,
									// 	branch_id: updatedBill.branch_id ? updatedBill.branch_id : null,
									// 	message: "Bill Paid",
									// 	status: "bill_partially_paid",
									// 	socket_data: "bill_partially_paid"
									// };

									let tableData = {
										_id: updatedBill.table_id ? updatedBill.table_id : null,
										floor_id: updatedBill.table_id ? updatedBill.table_id : null,
										table_id: updatedBill.table_id ? updatedBill.table_id : null,
										branch_id: updatedBill.branch_id ? updatedBill.branch_id : null,
										paid_bill_id: updateData.bill_id ? updateData.bill_id : null,
										message: "Bill Paid",
										status: "bill_partially_paid",
										socket_data: "bill_partially_paid"
									};

	
									socketController.io.sockets.in(updatedBill.branch_id).emit("update_table", tableData);
									socketController.io.sockets.in(updatedBill.branch_id).emit("update_order", tableData);
									socketController.io.sockets.in(updatedBill.table_id).emit("update_table", tableData);
								}
								
									res.status(201).json({
									status: 1,
									message: "Bill Updated Successfully",
									bills: updatedBill
								});
							} else {
								if (updatedBill.table_id) {
									Tables.findOneAndUpdate(
										{ _id: updatedBill.table_id },
										{
											$set: {
												total_amount: 0,
												table_amount: 0,
												table_order_status: "paid"
											}
										},
										(err, updatedTable) => {
											if (err) {
												console.error({
													status: 0,
													message: "Error Updating Bill",
													error: err
												});
												res.status(404).json({
													status: 0,
													message: "Error Updating Bill",
													error: "Problem with the server"
												});
											} else {
												Orders.findOneAndUpdate(
													{ table_id: updatedBill.table_id  },
													{ $set: { order_status: 'paid' } },
													(err, resultOrder) => {
														if (err) {
															console.error({
																status: 0,
																message: "error finding order",
																error: err
															});
														} else {
															res.status(201).json({
																status: 1,
																message: "Bill Updated Successfully",
																bills: updatedBill
															});
			
															let tableData = {
																_id: updatedTable._id ? updatedTable._id : null,
																floor_id: updatedTable.floor_id ? updatedTable.floor_id : null,
																table_id: updatedTable._id ? updatedTable._id : null,
																branch_id: updatedTable.branch_id ? updatedTable.branch_id : null,
																message: "Bill Confirmed",
																status: "bill_confirmed",
																socket_data: "all_bills_paid"
															};
			
															socketController.io.sockets.in(updatedTable.branch_id).emit("update_table", tableData);
															socketController.io.sockets.in(updatedTable.branch_id).emit("update_order", tableData);
			
															/**
															 * Mobile socket for users to let them know that all bills are paid
															 */
															socketController.io.sockets.in(updatedBill.table_id).emit("update_table", tableData);
			
															// PushController.notifyBranchMembers(
															// 	updatedTable.branch_id,
															// 	{ message: "New Table Bill" }
															// )
															PushController.notifyZoneMembers(
																updatedTable.branch_id, updatedTable.floor_id, updatedTable._id,
																{ message: "New Table Bill" }
															)
															
															PushController.notifyTableMembers(
																updatedBill.table_id,
																{ message: "Requested for bill" }
															)
														}
													})
											}
										}
									);
								} else if (updatedBill.takeaway_id) {
									Orders.findOneAndUpdate(
										{ order_id: updatedBill.takeaway_id },
										{ $set: { order_status: "awaiting_payment" } },
										(err, resultOrder) => {
											if (err) {
												console.error({
													status: 0,
													message: "error finding order",
													error: err
												});
												res.status(404).json({
													status: 0,
													message: "error finding order",
													error: "problem with the server"
												});
											} else {
												if (!resultOrder) {
													console.error({
														status: 0,
														message: "error finding order",
														error: err
													});
													res.status(404).json({
														status: 0,
														message: "error finding order",
														error: "problem with the server"
													});
												} else {
													res.status(201).json({
														status: 1,
														message: "Bill Confirmed Successfully",
														bills: updatedBill
													});

													let orderData = {
														_id: resultOrder._id,
														order_type: resultOrder.order_type,
														order_id: resultOrder.order_id,
														branch_id: resultOrder.branch_id,
														order_status: "awaiting_payment",
														message: "Bill Placed Successfully",
														socket_data: "all_bills_paid"
													};

													socketController.io.sockets.in(resultOrder.branch_id).emit("update_table", orderData);
													socketController.io.sockets.in(resultOrder.branch_id).emit("update_order", orderData);

													/**
													 * Mobile user to let them know that all bills are paid
													 */
													socketController.io.sockets.in(updatedBill.takeaway_id).emit("update_takeaway", orderData);

													PushController.notifyBranchMembers(
														resultOrder.branch_id,
														{ message: "New Bill Request" }
													)
													
													PushController.notifyOrderMembers(
														updatedBill.takeaway_id,
														{ message: "Your Bill Has Been Confirmed" }
													)
												}
											}
										}
									);
								} else {
									res.status(201).json({
										status: 1,
										message: "Bill Updated Successfully",
										bills: updatedBill
									});
								}
							}
						}
					}
				);
			} else {
				/**
				 * Note: This will update status without including paid_by detail
				 */
				Bill.findOneAndUpdate(
					{ "bills._id": updateData.bill_id },
					{
						$set: {
							"bills.$.bill_status": updateData.status
						}
					},
					{ new: true },
					function (err, updatedBill) {
						if (err) {
							console.error({
								status: 0,
								message: "Error updating bills",
								error: err
							});
							res.status(500).json({
								status: 0,
								message: "Error updating bills",
								error: "problem with the server"
							});
						} else {
							let unconfirmedBills = updatedBill.bills.filter(bill => {
								if (bill.bill_status != "confirmed") {
									return bill;
								}
							});

							if (unconfirmedBills.length) {
								res.status(201).json({
									status: 1,
									message: "Bill Updated Successfully",
									bills: updatedBill
								});
							} else {
								if (updatedBill.table_id) {
									Tables.findOneAndUpdate(
										{ _id: updatedBill.table_id },
										// { $set: { total_amount: 0, table_amount: 0, has_alert: false, table_order_status: '' } },
										{ $set: { has_alert: false, table_order_status: '' } },
										{ new: true },
										(err, updatedTable) => {
											if (err) {
												console.error({
													status: 0,
													message: "Error Updating Bill",
													error: err
												});
												res.status(404).json({
													status: 0,
													message: "Error Updating Bill",
													error: "Problem with the server"
												});
											} else {
												let tableData = {
													_id: updatedTable._id ? updatedTable._id : null,
													floor_id: updatedTable.floor_id ? updatedTable.floor_id : null,
													table_id: updatedTable._id ? updatedTable._id : null,
													branch_id: updatedTable.branch_id ? updatedTable.branch_id : null,
													message: "Bill Confirmed",
													status: "bill_confirmed",
													socket_data: 'all_bills_confirmed'
												};

												socketController.io.sockets.in(updatedTable.branch_id).emit("update_table", tableData);
												socketController.io.sockets.in(updatedTable.branch_id).emit("update_order", tableData);

												/**
												 * Mobile Socket for letting user that all bills are confirmed
												 */
												socketController.io.sockets.in(updatedBill.table_id).emit("update_table", tableData);
												
												res.status(201).json({
													status: 1,
													message: "Bill Updated Successfully",
													bills: updatedBill
												});
											}
										}
									);
								} else {
									res.status(201).json({
										status: 1,
										message: "Bill Updated Successfully",
										bills: updatedBill
									});
								}
							}
						}
					}
				);
			}
		});
	}
};

exports.UpdateTender = (req, res) => {
	let updatedata = req.body.bill_details;
	//let tender_type = req.params.tendertype;
	if (!updatedata.billId) {
		console.error({
			status: 0,
			message: "Please pass the bill id",
			error: "no bill id"
		});
		res.status(404).json({
			status: 0,
			message: "Please pass the bill id",
			error: "No bill Id found"
		});
	} else if(!updatedata.tender_type){
		console.error({
			status: 0,
			message: "Please pass the Tender Type",
			error: "no Tender Type"
		});
		res.status(404).json({
			status: 0,
			message: "Please pass the Tender Type",
			error: "No Tender Type found"
		});
	} else {
		/**
		 * Note: This will update status including paid_by detail
		 */
		 HistoryBills.findOne({ "bills._id": updatedata.billId }, (err, rbills) => {
			if(rbills){
				let selectedBill = rbills.bills.filter((bill) => bill._id == updatedata.billId)[0];
				console.log(selectedBill);
				FinanceLookup.update({ branch_id: rbills.branch_id, "tender_types.tender_type": selectedBill.paid_by}, 
				// {  $inc: { "tender_types.$.count": 1 } }
				{  $inc: { "tender_types.$.count": -1 } }
					, (err) => {
						if(err) {
							console.error('error --------', err)
						}
					}
				);
		

				HistoryBills.findOneAndUpdate(
					{ "bills._id": updatedata.billId },
					{
						$set: {
							"bills.$.paid_by": updatedata.tender_type
						}
					},
					{ new: false },
					(err, updatedBill) => {
						if (err) {
							console.error({
								status: 0,
								message: "Error updating bills",
								error: err
							});
							res.status(500).json({
								status: 0,
								message: "Error updating bills",
								error: "problem with the server"
							});
						} else {
							FinanceLookup.update({ branch_id: rbills.branch_id, "tender_types.tender_type": updatedata.tender_type}, 
							// {  $inc: { "tender_types.$.count": 1 } }
							{  $inc: { "tender_types.$.count": 1 } }
								, (err) => {
									if(err) {
										console.error('error --------', err)
									}
								}
							);
							PaymentHistory.update({ bill_id: updatedata.billId},
							{ $set: { payment_type: updatedata.tender_type } }
								, (err,paymnent) => {
									if(err) {
										console.error('error --------', err)
									}else{
							
										res.status(201).json({
											status: 1,
											message: "Tendertype Updated Successfully",
										//	bills: updatedBill
										});
									}
								}
								);
		


							// if (confirmedBills.length !== updatedBill.bills.length) {

						}
					}
				);
			}
		});
	
	}
};

exports.removeBill = (req, res) => {
};

//NOTE: In Billing Mostly it should be hard deleted, But for a backup am using soft delete here
//Will be helpful in future for analytics
exports.DeleteBill = (req, res) => {
	let billId = req.params.billId;
	if(billId) {
		Bill.remove({ _id: billId }, (err, removedBill) => {
			if (err) {
				console.error({
					status: 0,
					message: 'error removing bill',
					error: err
				});
				res.status(500).json({
					status: 0,
					message: 'error removing bill',
					error: 'problem with the server'
				});
			} else {
				Orders.findOneAndUpdate({ bill_id: billId }, { $set: { bill_id: undefined, is_order_paid: false, order_status: 'confirmed' } }, { new: true },
					(err, updatedOrder) => {
						if (err) {
							console.error({
								status: 0,
								message: 'error removing bill',
								error: err
							});
							res.status(500).json({
								status: 0,
								message: 'error removing bill',
								error: 'problem with the server'
							});
						} else if (updatedOrder) {
							res.status(201).json({
								status: 1,
								message: 'bill removed successfully',
							});

							let orderData = {
								_id: updatedOrder._id,
								order_type: updatedOrder.order_type,
								order_id: updatedOrder.order_id,
								branch_id: updatedOrder.branch_id,
								order_number: updatedOrder.order_number ? updatedOrder.order_number : updatedOrder._id,
								order_status: 'bill_removed',
								message: "bill removed",
								socket_data: "bill removed"
							};

							let tableData = {
								_id: updatedOrder._id ? updatedOrder._id : null,
								table_id: updatedOrder.table_id ? updatedOrder.table_id : null,
								branch_id: updatedOrder.branch_id ? updatedOrder.branch_id : null,
								message: "bill removed",
								status: "bill_removed",
								socket_data: 'bill_removed'
							};

							
							if(updatedOrder.table_id) {
								Tables.findOneAndUpdate({ _id: updatedOrder.table_id }, { $set: { table_order_status: null, has_alert: false } }, { new : true}, (err, tableResult) => {
									if(err) {
										console.error('Error updating table =>', err)
									}else{
										tableData.floor_id = tableResult.floor_id ? tableResult.floor_id : undefined,
										orderData.table_id = tableResult._id ? tableResult._id : undefined,
										tableData.table_id = tableResult._id ? tableResult._id : undefined,
											
										socketController.io.sockets.in(updatedOrder.branch_id).emit("update_table", tableData);
										socketController.io.sockets.in(updatedOrder.branch_id).emit("update_order", orderData);
										socketController.io.sockets.in(updatedOrder.table_id).emit("update_table", orderData);
										PushController.notifyZoneMembers(updatedOrder.branch_id, tableResult.floor_id, tableResult._id, {
											message: `bill removed for order ${orderData.order_number}`
										})

										PushController.notifyOrderMembers(updatedOrder.table_id, {
											message: "bill removed",
											mobile_data: "bill_removed"
										})
									}
								});
							}else if(updatedOrder.order_id) {
								socketController.io.sockets.in(updatedOrder.branch_id).emit("update_table", tableData);
								socketController.io.sockets.in(updatedOrder.branch_id).emit("update_order", orderData);
								socketController.io.sockets.in(updatedOrder.order_id).emit("update_takeaway", orderData);
								//socketController.io.sockets.in(updatedOrder.order_id).emit("update_table", orderData);
								socketController.io.notifyBranchMembers(updatedOrder.branch_id, {
									message: `bill removed for order ${orderData.order_number}`
								})
								PushController.notifyOrderMembers(updatedOrder.order_id, {
									message: "bill removed",
									mobile_data: "bill_removed"
								}).then(result => {
									console.info("Notified table users");
								});
							}
						} else {
							console.error({
								status: 0,
								message: 'error removing bill',
								error: err
							});
							res.status(404).json({
								status: 0,
								message: 'error removing bill',
								error: 'no order found for this bill'
							});
						}
					})
			}
		})
	}else {
		res.status(500).json({
			status: 0,
			message: 'error removing bill',
			error: 'No Bill Id Found'
		});
	}
};

/**
 * HISTORY MANAGEMENT
 */
exports.getBillHistory = (req, res) => { };
//CheckoutBill() :
exports.checkoutTable = (req, res) => {
	let orderDetail = req.body.order_details;
	let orderId = orderDetail._id;

	Orders.findOne({ _id: orderId }, (err, order) => {
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
		} else if(order) {
			let order_detail = JSON.parse(JSON.stringify(order));
			let history_order = new HistoryOrders(order_detail);
			if(order.order_status === 'delivered') {
				history_order.order_status = 'completed'
			} else {
				history_order.order_status = 'cancelled'
			}
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
				}

				let orderData = {
					_id: order._id,
					order_type: order.order_type,
					order_number: order.order_number,
					branch_id: order.branch_id,
					order_status: 'checkout',
					message: "bill checkout"
				};
				if(order.table_id) {
					orderData.table_id = order.table_id;
					socketController.io.sockets.in(order.table_id).emit("update_table", orderData);
				}else if(order.order_id) {
					socketController.io.sockets.in(order.order_id).emit("update_takeaway", orderData);
				}

				socketController.io.sockets.in(order.branch_id).emit("update_table", orderData);
				socketController.io.sockets.in(order.branch_id).emit("update_order", orderData);

				Orders.findByIdAndRemove(orderId, (err, removedOrder) => {
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
						}
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
							}
							Bill.findOneAndRemove({ order_id: orderId }, (err, removedBill) => {
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
								}
								if (order_detail && order_detail.table_id) {
									Tables.findOne(
										{ _id: order_detail.table_id },
										(err, tables) => {
											if (err) {
												console.error({
													status: 0,
													message: "Error getting tables",
													error: err
												});
												res.status(500).json({
													status: 0,
													message: "Error getting tables",
													error: "Problem with the server"
												});
											} else {
												let table_detail = JSON.parse(JSON.stringify(tables));
												table_detail.table_id = tables._id; //this will set the table id to table_id in history
												table_detail._id = undefined; //this will reset the old _id
												let table_history = new HistoryTables(table_detail);
												table_history['order_number'] = order_detail.order_number;
												table_history.save((err, tables) => {
													if (err) {
														console.error({
															status: 0,
															message: "Error moving table to table history",
															error: err
														});
														res.status(500).json({
															status: 0,
															message: "Error moving table to table history",
															error: "Problem with the server"
														});
													} else {
														QuickService.findOne(
															{ table_id: table_detail.table_id },
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
																								{
																									message: `Your last Order has been successfuly removed!`
																								}
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
																		{
																			message: `Your last Order has been successfuly removed!`
																		}
																	);
																}
															}
														);
														//   res.status(201).json({
														//     status: 1,
														//     message: "Table Updated Successfully"
														//   });
													}
												});
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
												// service._id = undefined
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
																	PushController.notifyTableMembers(
																		order.order_id,
																		{
																			message: `Your last Order has been successfuly removed!`
																		}
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
												PushController.notifyTableMembers(order.table_id, {
													message: `Your last Order has been successfuly removed!`
												});
											}
										}
									);
								} else {
									res.status(201).json({
										status: 1,
										message: "checkout sucess!"
									});
								}
							});
						});
					});
				});
			});
		} else {
			console.error({
				status: 0,
				message: "no orders found",
				error: 'invalid parameters'
			});
			res.status(404).json({
				status: 0,
				message: "no orders found",
				error: "invalid parameters"
			});
		}
	});
};
