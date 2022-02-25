"use strict";

const Eorder = require('../models/omsModels/eorder.model')
const Customer = require('../models/managementModels/customer_directory.model')
const Customer_directory = require("../controllers/managementController/customer_directory.controller");
const Branches = require("../models/branch.model");
const CompanyModel = require('../models/company.model');
const MenuItemController = require('../models/managementModels/menu_item.model');
const Order = require("../models/omsModels/order.model");
const ordercontroller = require("../controllers/omsController/order.controller");
const socketController = require("../controllers/common/socket.controller");
const Urbanpiperresponse = require('../models/omsModels/urbanpiper.model');
const DeliveryBrand = require("../models/managementModels/delivery_brand.model");
// Store Add/Update Callback

exports.getresponse = (req, res) => {
	let orderDetails = req.body;
	let referenceid ;
	let query;
	if(orderDetails.reference){
		query = {"request.reference" :orderDetails.reference}
		referenceid = orderDetails.reference;
	}
	if(orderDetails.reference_id){
		query = {"request.reference_id" :orderDetails.reference_id}
		referenceid = orderDetails.reference_id;
	}
	
Urbanpiperresponse.findOneAndUpdate(query,{$set:{"response":orderDetails}},{ new: true, upsert: true },function (err, result) {

					if (err) {
						console.error({
							status: 0,
							message: "error updating store status",
							error: err
						});
					}else{
						if(result){
							if(result.request_type == "Add/update Store action"){
								if(orderDetails.stats['errors'] == 0 && orderDetails.stats['created'] == 1){
									orderDetails.stores.forEach(store => {
										var branchid = store.ref_id.split("+");
										DeliveryBrand.findOneAndUpdate({"branch_id":branchid[0],"name":store.name},{$set:{"urban_id":store.upipr_status["id"]}},{ upsert: true },function (err, result) {
											if(err){
												console.error({
													status: 0,
													message: "error updating store status",
													error: err
												});
											}
										})
								
								});
							}
							}
						}
						res.status(200).json({
							status: 1,
							message: "success" ,
							
						});
					}
					
				
	}
);

}

// Update Order
exports.updateExternalOrder = (req, res) => {
	let orderDetails = req.body;
				Eorder.findOneAndUpdate(			
				{ "order.details.id": orderDetails.order_id },
				{
					$push: { "order_status": orderDetails }
				},
				{ new: true, upsert: true },
				function (err, result) {
					if (err) {
						console.error({
							status: 0,
							message: "error updating order status",
							error: err
						});
					}
					
					res.status(200).json({
						status: 1,
						message: result ,
						
					});
				}
			);

}

// Update Rider Status
exports.riderstatuschange = (req, res) => {
	let riderDetails = req.body;
	
				Eorder.findOneAndUpdate(			
				{ "order.details.id": riderDetails.order_id },
				{
					$push: { "rider_status": riderDetails }
				},
				{ new: true, upsert: true },
				function (err, result) {
					if (err) {
						console.error({
							status: 0,
							message: "error updating rider status",
							error: err
						});
					}
					Order.findOneAndUpdate({"external_order_id":riderDetails.order_id},{$set:{ "rider_status":riderDetails }},{new:true},
					function (err, result) {
						if (err) {
							console.error({
								status: 0,
								message: "error updating rider status",
								error: err
							});
						}
						let deliveryData = {
							delivery_id: result._id,
							message: "Your delivery order Status updated",
							order_status: riderDetails.delivery_info.current_state,
							branchId:result.branch_id
						};
						socketController.io.sockets
							.in(result.branch_id)
							.emit("update_delivery", deliveryData);
						res.status(200).json({
							status: 1,
							message: "Delivery updated successfully" ,
							
						});
					}
					);
					
				}
			);

}
exports.addExternalOrder = (req, res) => {
	let orderDetails = req.body;
	// orderDetails["company_id"] = req.companyId;
	// if (req.accessType === "superadmin" || req.accessType === "admin" || req.accessType === "staffs") {
	// 	orderDetails["branch_id"] = orderDetails.branch_id;
	// } else if (req.accessType === "guest") {
	// 	orderDetails["branch_id"] = req.branchId;
	// 	orderDetails["table_id"] = req.tableId;
	// 	orderDetails["order_list"].customer_id = req.userId;
	// 	orderDetails["order_list"].customer_name = req.userName;
	// } else {
	// 	res.status(401).json({
	// 		status: 0,
	// 		message: "Unauthorized Access"
	// 	});
	// }

	let eorder = new Eorder(orderDetails);

	eorder.save((err, addedExternalOrder) => {
		if (err) {
			console.error({
				status: 0,
				message: "Error getting Delivery orders",
				error: err
			});
			res.status(500).json({
				status: 0,
				message: "Error getting Delivery orders",
				error: err
			});
		}else{
		let Mobile = addedExternalOrder.customer.phone; 
		Mobile = Mobile.slice(3);
		const splitstring  = addedExternalOrder.order.store.merchant_ref_id.split("+");
		let branch_id = splitstring[0];
		let company_id = "";
		let address= "";
		let deliveryaddress= "";
		let customerId = "";
		let cusomername = "";
		Branches.findOne({ _id: branch_id }, async (err, branches) => {
			if (err) {
				res.status(500).json({
					status: 0,
					message: 'Error reading branch',
					error: 'Problem with the server'
				});
			} else {
				company_id = branches.company_id;
				
				await CompanyModel.findOne({ _id: branches.company_id }, (err, results) => {
					if (err) {
						console.error('error finding company ---------', err)
					} else {
						branches['logo_url'] = results.logo_url ? results.logo_url : '';
						//branches['name_1'] = 'pravin'
					}
				});
			
			}
		});
		Customer.findOne(
			{ branch_id: branch_id, contact_number: Mobile },
			{ password: 0 },
			(err, customers) => {
				if (err) {
					res.status(404).json({
						status: 0,
						message: "Error Getting Customer",
						error: err
					});
				}else{
				
					var locate = "";
				
					if(addedExternalOrder.customer.address.line_1 != null){
						locate = addedExternalOrder.customer.address.line_1;
					}
					if(addedExternalOrder.customer.address.line_2 != null){
						locate = locate +"," + addedExternalOrder.customer.address.line_2;
					}
					if(addedExternalOrder.customer.address.sub_locality != null){
						locate = locate + "," + addedExternalOrder.customer.address.sub_locality;
					}
					address = {
						"person_name": addedExternalOrder.customer.name
						, "person_contact": Mobile
						, "address" : locate
						, "landmark": addedExternalOrder.customer.address.landmark
						, "address_name": addedExternalOrder.order.details.channel
					}
				
					if(customers){
						customerId = customers._id;
						cusomername = customers.name;
						address.person_name = cusomername;
					Customer.update(
						{ _id: customerId },
						{
							$push: { addresses: address }
						},
						{ new: true, upsert: true },
						function (err, result) {
							if (err) {
								console.error({
									status: 0,
									message: "error inserting new Address",
									error: err
								});
							}
						}
					);
					}else{
						var customerDetail = {
							"company_id": company_id
							, "contact_number": Mobile
							, "visits" : 1
							, "addresses": address
							, "branch_id": branch_id
							, "name":addedExternalOrder.customer.name
							, "email":addedExternalOrder.customer.email
							, "registered_by":addedExternalOrder.order.details.channel
						}
						let customer = new Customer(customerDetail);
						customer.save((err, savedResult) => {
							if (err) {
								console.error({
									status: 0,
									message: "Error adding Customer",
									error: err
								});
								res.status(500).json({
									status: 0,
									message: "Error Adding Customer ",
									error: "Problem with the server"
								});
							}else{
								customerId = savedResult._id;
								cusomername = savedResult.name;
							}
						});
					}
					deliveryaddress = {
						"customer_id": customerId,
						"person_name": addedExternalOrder.customer.name,
						"person_contact": Mobile,
						"address": locate,
						"address_name": addedExternalOrder.order.details.channel,
						"landmark": addedExternalOrder.customer.address.landmark
					}
					var item_details = [];
					let order_tax_details = [];
					let order_count;
					var items = new Promise((resolve, reject) => {

					addedExternalOrder.order.items.forEach((item, index, array) => {
					
					getitems(item.merchant_id,async function(info) {
						let taxrates = [];
						let newitem = {};
						newitem.item_status = "ordered";
						newitem.quantity = item.quantity;
						newitem.sold_price = item.total;
                        newitem.customer_id = customerId;
                        newitem.customer_name = cusomername;
						newitem.is_applied_tax = info.is_applied_tax;
						newitem.category_id = info.category_id;
						newitem.item_id = info._id;
						newitem.name = info.name;
						newitem.selling_price = info.selling_price;
						newitem.assigned_printers = info.assigned_printers;
						let applied_addons =[];
						if(item.options_to_add.length > 0){
						
						await item.options_to_add.forEach(addon=>{
								info.addons.forEach(itemaddon =>{
									itemaddon.options.forEach(option=>{
										if(addon.merchant_id == option._id){
											let addons = {};
											addons.name = option.name;
											addons._id = option._id;
											addons.heading =itemaddon.heading;
											addons.type = itemaddon.type;
											addons.price = option.price;
											applied_addons.push(addons);
										}
									})
									
								
								})
								
							})
						
						}
						newitem.applied_addons = applied_addons;
						newitem.requests = info.requests;
						
						
						await item.taxes.forEach((tax)=>{
							info.tax_rates.forEach((itemtax)=>{
								if(itemtax.checked === true){
								if(tax.title === itemtax.tax_type ){
									itemtax.item_price = item.total;
									itemtax.item_gst_price = tax.value;
									taxrates.push(itemtax);
									let order_tax = {
											"tax_type":itemtax.tax_type,
											"item_gst_price":itemtax.item_gst_price,
											"tax_percentage":itemtax.percentage
									}
									order_tax_details.push(order_tax);
									
								}
							}
							})

						})
						
						newitem.tax_rates = taxrates;
						//const merged = Object.assign({}, info, newitem);
						//const merged = { ...info, ...newitem } 
						
						item_details.push(newitem);
						
						if (index === array.length -1) resolve();
					  });
					  

					
					});
					});
					function groupBy(array){
						return Object.values(array.reduce((grouped, {item_gst_price,...rest}) => {
							const key = Object.entries(rest).join('-');
							if(!grouped[key]){
								grouped[key] = {...rest, item_gst_price: 0};
							}
							// grouped[key].quantity++;
							grouped[key].item_gst_price += item_gst_price;
							return grouped;
						},{}));
					}
					var count = new Promise((resolve, reject) => {
						order_count = ordercontroller.updateCount(branch_id, 'order', "home_delivery");
						resolve(order_count);
					});
					items.then(()=>{
					
						
					
					const result = groupBy(order_tax_details);
					
					let order_list =[ {
						"order_status": "placed",
						"item_details":item_details,
					}];
					let order_discount ={};
					if(addedExternalOrder.order.details.discount > 0){
						order_discount.discount_reason = "Manager Approved";
						order_discount.discount_type = "amount";
						order_discount.discount_number = addedExternalOrder.order.details.discount;
					}
					let final_cost = addedExternalOrder.order.details.order_subtotal - addedExternalOrder.order.details.discount;
					count.then((ordercount)=>{
					let OrderDetails = {
						"external_order_id":addedExternalOrder.order.details.id,
						"has_alert": true,
						"company_id":company_id,
						"branch_id": branch_id,
						"delivery_address":deliveryaddress,
						"delivery_person":addedExternalOrder.order.details.channel,
						"order_type":"home_delivery",
						"placedorder_id": null
						, "delivery_id": deliveryIdGenerator()
						, "order_list" : order_list
						, "order_status": "placed",
						"paid_by": "",
						"order_tax_amount": addedExternalOrder.order.details.total_taxes,
						"order_tax_details": result,
						"order_discount":order_discount,
						"is_applied_service_charge": false,
						"service_charge_percentage": 0,
						"service_charge_amount": 0,
						"total_cost_after_dicount": final_cost,
						"total_after_incl_tax": addedExternalOrder.order.details.order_total,
						"order_id": null,
						"total_cost": 0,
						"final_cost": 0,
						"grand_total": 0,
						"order_number": ordercount.new_order_count,
						"order_type_number":ordercount.new_order_type_count

					}
					// await ordercontroller.updateorder().then((order) => {
					// 	console.log(order);
					// 	console.info("Order successfully updated by superadmin");
					// });

					let order = new Order(OrderDetails);

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
								error: err
							});
						}
						const data = JSON.stringify({
							reference_id: "addedOrder._id"
						});
						
						const request = require('request');
						request({ url: 'https://pos-int.urbanpiper.com/external/api/v1/orders/'+addedExternalOrder.order.details.id+'/',headers: {'Content-Type': 'application/json','Authorization': 'apikey biz_adm_clients_zSKoOhaHdVkn:36dd26120ee18ba935bc40f1ab1d1dfda4930aba'}, method: 'PUT', json: {reference_id: addedOrder._id}}, callback);
						function callback(error, response, body) {
							if (!error && response.statusCode == 200) {
								let deliveryData = {
									delivery_id: addedOrder._id,
									message: "Your delivery order has been Created",
									order_status: "placed",
									branchId:branch_id
								};
								socketController.io.sockets
									.in(branch_id)
									.emit("update_delivery", deliveryData);
								res.status(201).json({
									status: 1,
									message: "Order Placed Successfully",
									order_id: addedOrder._id,
									referenceupdate: body
								});
								
							}
						}
						
					});
				// res.status(200).json({
				// 	status: 1,
				// 	message: "Customer Added Successfully",
				// 	customer: orderDetails
				// });
			});
			});
				}
		
			}
			
		);
		
	}
	
		// res.status(200).json({
		// 	status: 1,
		// 	message: "Order Saved Successfully",
		// 	order_id: addedExternalOrder._id
		// });
	});
	async function getitems(itemid,callback){
		await MenuItemController.findOne({ _id: itemid }, async (err, iteminfo) => {
			
			if (err) {
				console.error({
					status: 0,
					message: 'Error finding Item',
					error: err
				});
				res.status(500).json({
					status: 0,
					message: 'Error finding Item',
					error: err
				});
				callback(err);
			} else {
			//	return iteminfo;
				callback(iteminfo);
				//r
			//	item_details.push(iteminfo);
			}
		})
	}
	function deliveryIdGenerator() {
		// var S4 = function () {
		// 	return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
		// };
		// return (S4() + S4() + S4() + S4());
	
		let now = new Date();
	
		let timestamp = now.getFullYear().toString(); // 2011
		timestamp += (now.getMonth() < 9 ? '0' : '') + now.getMonth().toString(); // JS months are 0-based, so +1 and pad with 0's
		timestamp += (now.getDate() < 10 ? '0' : '') + now.getDate().toString(); // pad with a 0
		timestamp += (now.getHours() < 10 ? '0' : '') + now.getHours().toString(); // pad with a 0
		timestamp += (now.getMinutes() < 10 ? '0' : '') + now.getMinutes().toString(); // pad with a 0
		timestamp += (now.getSeconds() < 10 ? '0' : '') + now.getSeconds().toString(); // pad with a 0
		timestamp += (now.getMilliseconds() < 10 ? '0' : '') + now.getMilliseconds().toString(); // pad with a 0
		// ... etc... with .getHours(), getMinutes(), getSeconds(), getMilliseconds()
		return `HD${timestamp}`;
	}
};
