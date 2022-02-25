"use strict";
const Customer = require("../../models/managementModels/customer_directory.model");
const Table = require("../../models/omsModels/table.model");
const TableController = require("../omsController/table.controller");
const User = require("../../models/auth.model");
const jwt = require("jsonwebtoken");
const socketController = require('../common/socket.controller');

const Push = require('./../common/push.controller');

/**
 * Get Customers of Branch
 * @param companyId
 */
exports.getBrandCustomers = (req, res) => {
	let query_value = "";
	if ((req.accessType === "admin")|| (req.accessType === "superadmin") || (req.accessType === 'staffs')) {
		query_value = req.companyId;
	} else {
		console.error({
			status: 0,
			message: "UnAuthorized Access",
			error: 'invalid access'
		});
		res.status(401).json({
			status: 0,
			message: "UnAuthorized Access",
			error: "Problem with the server"
		});
	}

	if(query_value) {
		Customer.find(
			{ company_id: query_value, status: "active" },
			(err, customers) => {
				if (err) {
					console.error({
						status: 0,
						message: "Error finding Customers",
						error: err
					});
					res.status(404).json({
						status: 0,
						message: "Error finding Customers",
						error: "Problem with the server"
					});
				} else {
					res.status(200).json({
						status: 1,
						message: "Customers Obtained Successfully",
						customers: customers
					});
				}
	
			}
		);
	}
};

/**
 * Get Customers of Branch
 * @param branchId
 */
exports.getBranchCustomers = (req, res) => {
	let query_value = "";
	if ((req.accessType === "admin")|| (req.accessType === "superadmin") || (req.accessType === 'staffs')) {
		query_value = req.params.branchId;
	} else {
		console.error({
			status: 0,
			message: "UnAuthorized Access",
			error: 'invalid access'
		});
		res.status(401).json({
			status: 0,
			message: "UnAuthorized Access",
			error: "Problem with the server"
		});
	}

	if(query_value) {
		Customer.find(
			{ branch_id: query_value, status: "active" },
			(err, customers) => {
				if (err) {
					console.error({
						status: 0,
						message: "Error finding Customers",
						error: err
					});
					res.status(404).json({
						status: 0,
						message: "Error finding Customers",
						error: "Problem with the server"
					});
				} else {
					res.status(200).json({
						status: 1,
						message: "Customers Obtained Successfully",
						customers: customers
					});
				}
	
			}
		);
	}
};

/**
 * Get a particular Customer
 * @param CustomerId
 */
exports.getCustomer = (req, res) => {
	let customer_id = req.params.customerId; // || req.customerId; // $or condition works for mobile app customer
	Customer.findOne(
		{ company_id: req.companyId, _id: customer_id },
		{ password: 0 },
		(err, customers) => {
			if (err) {
				console.error({
					status: 0,
					message: "Error getting Customer",
					error: err
				});
				res.status(404).json({
					status: 0,
					message: "Error Getting Customer",
					error: "Problem with the server"
				});
			}else{
				res.status(200).json({
					status: 1,
					message: "Customers Obtained Successfully",
					customers: customers
				});
			}
		}
	);
};

/**
 * Add Customer Action
 * @body customer details
 * Deprecated Check if it is used anywhere
 */
exports.addCustomer = (req, res) => {
	let customerDetails = req.body.customer_details;
	customerDetails.company_id = req.companyId;

	let customer = new Customer(customerDetails);
	customer.save((err, savedCustomer) => {
		if (err) {
			console.error({
				status: 0,
				message: "Error adding Customer",
				error: err
			});
			res.status(404).json({
				status: 0,
				message: "Error adding Customer",
				error: "Problem with the server"
			});
		}
		res.status(200).json({
			status: 1,
			message: "Customer Added Successfully",
			customer: savedCustomer
		});
	});
};

/**
 * Updating Existing Customer
 */
exports.updateCustomer = (req, res) => {
	let customerDetail = req.body.customer_details;
	if (!customerDetail._id) {
		customerDetail["company_id"] = req.companyId;
		let customer = new Customer(customerDetail);
		customer.save((err, savedResult) => {
			if (err) {
				console.error({
					status: 0,
					message: "Error adding Customer",
					error: err
				});
				res.status(404).json({
					status: 0,
					message: "Error Adding Customer ",
					error: "Problem with the server"
				});
			}else{
				res.status(200).json({
					status: 1,
					message: "Customer Added Successfully",
					customer: savedResult
				});
			}
		});
	} else {
		Customer.findById(customerDetail._id, (err, customer_detail) => {
			if (err) {
				console.error({
					status: 0,
					message: "Error updating Customer",
					error: err
				});
				res.status(404).json({
					status: 0,
					message: "Error Updating Customer ",
					error: "Problem with the server"
				});
			}

			if(customer_detail) {
				customer_detail.set(customerDetail);
				customer_detail.save((err, updatedDetails) => {
					if (err) {
						console.error({
							status: 0,
							message: "Error updating Customer",
							error: err
						});
						res.status(404).json({
							status: 0,
							message: "Error Updating Customer ",
							error: "Problem with the server"
						});
					}else{
						res.status(200).json({
							status: 1,
							message: "Customer Updated successfuly",
							customer: updatedDetails
						});
					}
				});
			} else {
				console.error({
					status: 0,
					message: "Error updating Customer",
					error: err
				});
				res.status(404).json({
					status: 0,
					message: "Error Updating Customer ",
					error: "No User Found"
				});
			}
		});
	}
};

/**
 * Action removing Customer
 */
exports.removeCustomer = (req, res) => {
	let customerDetail = req.body.customer_details;
	Customer.findById(customerDetail._id, (err, customer_detail) => {
		if (err) {
			console.error({
				status: 0,
				message: "Error removing Customer",
				error: err
			});
			res.status(404).json({
				status: 0,
				message: "Error removing Customer ",
				error: "Problem with the server"
			});
		}
		customer_detail.set({ status: customerDetail.status });
		//TODO need to restrict the returning data
		customer_detail.save((err, updatedDetails) => {
			if (err) {
				console.error({
					status: 0,
					message: "Customer removed Successfully",
					error: err
				});
				res.status(404).json({
					status: 0,
					message: "Error Adding Customer ",
					error: "Problem with the server"
				});
			}
			res.status(200).json({
				status: 1,
				message: "Customer removed successfully"
			});
		});
	});
};

/**
 * Action Updating Customer
 */
exports.updateAddress = (req, res) => {
	let customerDetail = req.body.customer_details;
	let customerId = customerDetail.customer_id;
	if (!customerDetail._id) {
		Customer.update(
			{ _id: customerId },
			{
				$push: { addresses: customerDetail }
			},
			{ new: true, upsert: true },
			function (err, result) {
				if (err) {
					console.error({
						status: 0,
						message: "error inserting new stock movement",
						error: err
					});
				}
				res.status().json({
					status: 1,
					message: "Address Updated Successfully",
					address: result
				});
			}
		);
	} else {
		Customer.update(
			{ "addressess._id": customerDetail._id },
			{
				$set: { "addresses.$": updateData }
			},
			(err, response) => {
				if (err) {
					console.error({
						status: 0,
						message: "error updating Address",
						error: err
					});
					res.status(404).json({
						status: 0,
						message: "error updating Address",
						error: err
					});
				}
			}
		);
	}
};

/**
 * Customer Module
 */
exports.registerCustomer = (req, res) => {
	let customerDetails = req.body.customer_details;

	Customer.findOne({
				$or: [
					{ email: customerDetails.email },
					{ contact_number: customerDetails.contact_number }
				]
		},
		{ _id: 0, password: 0 }
	).then(exsistingCustomer => {
		if (exsistingCustomer) {
			if (exsistingCustomer.registered) {
				if (exsistingCustomer.email === customerDetails.email) {
					res.status(404).json({
						status: 0,
						message: "Email ID already registered with an existing account"
					});
				} else if (
					exsistingCustomer.contact_number === customerDetails.contact_number
				) {
					res.status(404).json({
						status: 0,
						message: "Mobile already registered with an existing account"
					});
				}
			} else {
				res.status(404).json({
					status: 0,
					message: "Exisitng Customer",
					customer_details: exsistingCustomer
				});
			}
			// Also make sure you are securing the data of the user
			// TODO: Let the user know that the data they've provided is already existing and give them option to update them as registered user
		} else {
			customerDetails["registered"] = true;
			if (customerDetails.social_unique_id) {
				customerDetails["registered_by"] = "social";
			} else {
				customerDetails["registered_by"] = "manual";
			}
			let customer = new Customer(customerDetails);

			customer
				.save()
				.then(savedCustomer => {
					res.status(200).json({
						status: 0,
						message: "Customer Registered Successfully",
						customer_details: savedCustomer
					});
				})
				.catch(err => {
					console.error({
						status: 0,
						message: "Error registering Customer",
						error: "Problem with the server"
					});
				});
		}
	})
	.catch(err => {
		console.error({
			status: 0,
			message: "Error registering Customer",
			error: "Problem with the server"
		});
	});
};

/**
 * Customer Login
 * Depricated
 */
exports.loginCustomer = (req, res) => {
	let customerData = req.body;
	Customer.findOne({
		$or: [
			{ email: customerData.email },
			{ contact_number: customerData.contact_number }
		]
	})
		.then(customer => {
			if (!customer) {
				res.status(401).json({
					status: 0,
					message: "Should be a valid email id",
					message: "Invalid Email"
				});
			} else if (!customer.registered) {
				res.status(401).json({
					status: 1,
					message: "User is not registered yet",
					error: "Unregistered customer"
				});
			} else if (customer.social_unique_id) {
				if (!customer.compareSocialId(customerData.social_unique_id)) {
					res.status(401).json({
						status: 0,
						message: "social ID Should be a valid",
						error: "Invalid Social ID"
					});
				} else {
					res.status(200).json({
						status: 0,
						message: "Authentication Successful",
						customer_details: customer
					});
				}
			} else if (!customer.comparePassword(customerData.password)) {
				res.status(401).json({
					status: 0,
					message: "Permission denied",
					error: "Invalid Password"
				});
			} else {
				res.status(200).json({
					status: 1,
					message: "Authentication Successful",
					customer_details: customer
				});
			}
		})
		.catch(err => {
			console.error({
				status: 0,
				message: "Authentication Failed",
				error: err
			});
			res.status(401).json({
				status: 0,
				message: "Access Denied",
				error: "Authentication Failed"
			});
		});
};

/**
 * Social Login For Mobile Customers
 * [ Google, FaceBook, Email Logins ]
 */
exports.socialLogin = (req, res) => {
	let customerDetails = req.body.customer_details;
	let branchId = req.body.branch_id;
	let tableId = req.body.table_id ? req.body.table_id : undefined;
	let orderId = req.body.order_id ? req.body.order_id : undefined ; 
	let floorId = req.body.floor_id ? req.body.floor_id : undefined;        //NOTE: This might change in near future, since floors are not manadtory for branches
	let companyId = customerDetails.company_id
	let deviceToken = {};

	if (customerDetails.device_token) {
		deviceToken['endpoint'] = customerDetails.device_token;
		deviceToken['application_type'] = customerDetails.application_type ? customerDetails.application_type : 'mobile'; // TODO: Use proper code here!
		deviceToken['device_type'] = customerDetails.device_type ? customerDetails.device_type : "android";    //FIXME: Change it to work dinamically
	}


	let query;
	let customer_mobile_number = customerDetails['mobile'] ? customerDetails['mobile'] : customerDetails['contact_number'];
	if(customer_mobile_number) {
		query = { contact_number: customer_mobile_number, company_id: customerDetails.company_id }
	} else {
		query = { email: customerDetails.email, company_id: customerDetails.company_id }
	}
	// Customer.findOne({ email: customerDetails.email, company_id: customerDetails.company_id }, { password: 0 })
	Customer.findOne(query, { password: 0 })
		.then(async exsistingCustomer => {
			if (exsistingCustomer) {

				if(!exsistingCustomer.email || !exsistingCustomer.contact_number) {
					// customerDetails['_id'] = exsistingCustomer._id;
					exsistingCustomer.set(customerDetails);

					// exsistingCustomer["registered_by"] = customerDetails.third_party_provider ? customerDetails.third_party_provider : exsistingCustomer.third_party_provider;
					// customerDetails['contact_number'] = customerDetails['mobile'] ? customerDetails['mobile'] : customerDetails['contact_number']; // this will help to assign mobile param with
					// customerDetails['email'] = customerDetails['email'] ? customerDetails['email'] : exsistingCustomer['email']; // this will help to assign mobile param with
					// customerDetails['contact_number'] = customerDetails['contact_number'] ? customerDetails['contact_number'] : exsistingCustomer['contact_number']; // this will help to assign mobile param with
					// let customer = new Customer(exsistingCustomer);
					// exsistingCustomer.device_token = []

					if (deviceToken) {
						customer.device_token.push(deviceToken)
					}

					await exsistingCustomer.save()
				}

				let payload = {
					userId: exsistingCustomer._id,
					userName: exsistingCustomer.name,
					social_unique_id: exsistingCustomer.social_unique_id,
					branchId: branchId,
					companyId: companyId,
					accessType: "guest",
				};

				if (deviceToken) {
					payload.deviceToken = deviceToken;
				}

				if (deviceToken && !exsistingCustomer.device_token.length) {
					exsistingCustomer.device_token.push(deviceToken);
					exsistingCustomer.visits++;
					exsistingCustomer.save((err, insertedToken) => {
						if (err) {
							console.error({
								status: 0,
								message: 'Error saving token',
								error: err
							});
							res.status(400).json({
								status: 0,
								message: 'Error saving token',
								error: 'Problem with user device config'
							})
						}
					})
				} else if (deviceToken && exsistingCustomer.device_token.length) {
					let ExistinToken = exsistingCustomer.device_token.filter((token) => {
						if(deviceToken.application_type === 'mobile') {
							if(token.application_type === 'mobile') {
								return token.endpoint == deviceToken.endpoint
							}
						}else if(deviceToken.application_type === 'web') {
							if(token.application_type === 'web') {
								return token.endpoint.endpoint == deviceToken.endpoint.endpoint
							}
						}
					})

					if (!ExistinToken.length) {
						/**
						 * Emptying the existing customer deive_token below , 
						 * since we just want to store only one token at a time
						 * If incase if the product owner want multiple device logins remove the emptying thing below
						 */
						exsistingCustomer.device_token = [];
						exsistingCustomer.device_token.push(deviceToken);
						exsistingCustomer.visits++;
						exsistingCustomer.save((err, insertedToken) => {
							if (err) {
								console.error({
									status: 0,
									message: 'error saving token',
									error: err
								});
								res.status(400).json({
									status: 0,
									message: 'error saving token',
									error: 'error with your device config'
								});
							}
						})
					} else{
						exsistingCustomer.visits++;
						exsistingCustomer.save();
					}
				}

				if(tableId) {

					let userTableSessions = await Table.find({ branch_id: branchId, _id: { '$ne': tableId }, session_status: 'active', 'members.user_id': (exsistingCustomer._id).toString()  });

					if(userTableSessions.length) {
						let activeTable = userTableSessions[0]
						console.error({
							status: 0,
							message: 'user active session found',
							table_name: activeTable.name ? activeTable.name : '',
							error: 'user is active on other table'
						});
						res.status(401).json({
							status: 0,
							message: 'user active session found',
							table_name: activeTable.name ? activeTable.name : '',
							error: 'user is active on other table, please close the session and try again'
						});
					} else {
						Table.findById(tableId, (err, table_detail) => {
							if (err) {
								console.error({
									status: 0,
									message: "Error finding Table",
									error: err
								});
								res.status(404).json({
									status: 0,
									message: "Error finding Table",
									error: "Problem with the server"
								});
							} else {
								// tell user if already engaged
								let duplicateMembers = table_detail.members.filter((member) => {
									// NOTE: Converting toString since it is of object type
									if(member) {
										return member.toString() === exsistingCustomer._id.toString()
									}
								});
		
								if (!duplicateMembers.length) {
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
									// 	// username: exsistingCustomer.name,
									// 	user_id: exsistingCustomer._id.toString(),
									// 	// user_visits: exsistingCustomer.visits ? exsistingCustomer.visits : 0
									// });
									tableDetail.members.push(exsistingCustomer._id.toString());
		
									//TODO: Change this time, get time from clientside
									if (!table_detail.session_started_at) {
										tableDetail.session_started_at = Date.now();
									}
		
									if (table_detail.table_members === 0) {
										TableController.getNextColor(table_detail.branch_id, (color) => {
											tableDetail.table_color = color;
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
		
													payload.tableId = tableId ? tableId : undefined;
													payload.floorId = floorId ? floorId : undefined; 
	
													let token = jwt.sign(payload, "thisissparta");
	
													socketController.io.sockets.in(branchId).emit('update_table', table_detail)
													// /**
													//  * Mobile Order Socket to know that there is a new user on the table
													//  */
													// let socketData = {
													// 	table_id: updatedDetails._id,
													// 	branch_id: updatedDetails.branch_id,
													// 	table_members: updatedDetails.table_members,
													// 	total_members: updatedDetails.total_members,
													// 	table_amount: updatedDetails.table_amount,
													// 	total_amount: updatedDetails.total_amount,
													// 	socket_data: 'new_table_member'
													// }
													// socketController.io.sockets.in(updatedDetails._id).emit('update_table', socketData)
													res.status(200).json({
														status: 1,
														message: "User Logged In Successfully",
														userId: payload.userId,
														userName: payload.userName,
														sessionStartedAt: updatedDetails.session_started_at,
														token: token
													});

													Push.notifyTableMembers(tableId, { message: 'Table Occupied Successfully' })
													// Push.notifyBranchMembers(branchId, { message: `Table ${table_detail.name} Occupied` })
													Push.notifyZoneMembers(branchId, floorId, tableId, { message: `Table ${table_detail.name} Occupied` })

													// Push.notifyTableMembers(tableId, { message: 'Table Occupied Successfully' }).then((result) => {
													// 	Push.notifyBranchMembers(branchId, { message: `Table ${table_detail.name} Occupied` }).then((members) => {
													// 		// socketController.io.sockets.in(branchId).emit('table_occupied_mobile', table_detail);
													// 		res.status(200).json({
													// 			status: 1,
													// 			message: "User Logged In Successfully",
													// 			userId: payload.userId,
													// 			userName: payload.userName,
													// 			sessionStartedAt: updatedDetails.session_started_at,
													// 			token: token
													// 		});
													// 	}).catch((error) => {
													// 		res.status(200).json({
													// 			status: 1,
													// 			message: "User Logged In Successfully",
													// 			userId: payload.userId,
													// 			userName: payload.userName,
													// 			sessionStartedAt: updatedDetails.session_started_at,
													// 			token: token
													// 		});
													// 	});
													// }).catch((err) => {
													// 	res.status(200).json({
													// 		status: 1,
													// 		message: 'Problem Notifying all users',
													// 		userId: payload.userId,
													// 		userName: payload.userName,
													// 		sessionStartedAt: updatedDetails.session_started_at,
													// 		token: token
													// 	})
													// })
		
												}
		
											});
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
												payload.tableId = tableId ? tableId : undefined;
												payload.floorId = floorId ? floorId : undefined;
												
												let token = jwt.sign(payload, "thisissparta");
		
												// socketController.io.sockets.in(branchId).emit('update_table', table_detail)
												/**
												 * Mobile User socket for more than one user
												 */
												let socketData = {
													table_id: updatedDetails._id,
													floor_id: updatedDetails.floor_id ? updatedDetails.floor_id : undefined,
													branch_id: updatedDetails.branch_id,
													members: updatedDetails.members,
													table_members: updatedDetails.table_members,
													total_members: updatedDetails.total_members,
													table_amount: updatedDetails.table_amount,
													total_amount: updatedDetails.total_amount,
													socket_data: 'new_table_member'
												}
												socketController.io.sockets.in(updatedDetails._id).emit('update_table', socketData);
	
												socketController.io.sockets.in(branchId).emit('update_table', socketData) //will be helpful in notifying branch
	
												let newUserData = {
													user_id: exsistingCustomer._id,
													username: exsistingCustomer.name,
													branch_id: branchId,
													table_id: tableId
												};
												socketController.io.sockets.in(tableId).emit('new_user_table', newUserData); //user joined table
												
												res.status(200).json({
													status: 1,
													message: "User Logged In Successfully",
													userId: payload.userId,
													userName: payload.userName,
													sessionStartedAt: updatedDetails.session_started_at,
													token: token
												});

												Push.notifyTableMembers(tableId, { message: 'new member on table'})

												// Push.notifyTableMembers(tableId, { message: 'new member on table'}).then((result) => {
												// 	//NOTE: Commented this notification since I think it is unnecessary to notify branch members for this
												// 	// remove the comments if u want this option
												// 	// Push.notifyBranchMembers(branchId, { message: 'new members added on table'}).then((members) => {
												// 		// socketController.io.sockets.in(branchId).emit('table_occupied_mobile', table_detail)
												// 		// socketController.io.sockets.in(branchId).emit('update_table', table_detail)
												// 		res.status(200).json({
												// 			status: 1,
												// 			message: "User Logged In Successfully",
												// 			userId: payload.userId,
												// 			userName: payload.userName,
												// 			sessionStartedAt: updatedDetails.session_started_at,
												// 			token: token
												// 		});
												// 	// }).catch((error) => {
												// 	// 	res.status(200).json({
												// 	// 		status: 1,
												// 	// 		message: "User Logged In Successfully",
												// 	// 		token: token
												// 	// 	});
												// 	// });
												// }).catch((err) => {
												// 	res.status(200).json({
												// 		status: 1,
												// 		message: 'Problem Notifying all users',
												// 		userId: payload.userId,
												// 		userName: payload.userName,
												// 		sessionStartedAt: updatedDetails.session_started_at,
												// 		token: token
												// 	})
												// })
		
											}
										});
									}
								} else {
									payload.tableId = tableId ? tableId : undefined;
									payload.floorId = floorId ? floorId : undefined;
									let token = jwt.sign(payload, "thisissparta");
	
									res.status(200).json({
										status: 1,
										message: 'User Logged in Successfully',
										userId: payload.userId,
										userName: payload.userName,
										sessionStartedAt: table_detail.session_started_at,
										token: token
									})
								}
							}
						});
					}
				}else if(orderId) {
					payload.orderId = orderId ? orderId : undefined;
					let token = jwt.sign(payload, "thisissparta");
	
					socketController.io.sockets.in(branchId).emit('update_takeaway', { branch_id : payload.branchId });

					Push.notifyBranchMembers(branchId, { message: `New Takeaway order` }).then((members) => { 
						res.status(200).json({
							status: 1,
							message: 'User Logged in Successfully',
							userId: payload.userId,
							userName: payload.userName,
							// sessionStartedAt: Date.now(),
							token: token
						})
					});
				}else{
					console.error({
						status: 0,
						message: 'Invalid Parameters',
						error: 'please pass table or order id'
					});
					res.status(400).json({
						status: 0,
						message: 'Invalid Parameters, Please pass order or table id',
					});
				}
				// after engaging table inform branch members and admin
			} else {
				customerDetails["registered_by"] = customerDetails.third_party_provider;
				customerDetails['contact_number'] = customerDetails['mobile'] ? customerDetails['mobile'] : customerDetails['contact_number']; // this will help to assign mobile param with
				let customer = new Customer(customerDetails);
				customer.device_token = []

				if (deviceToken) {
					customer.device_token.push(deviceToken)
				}

				customer
					.save()
					.then(savedCustomer => {
						let payload = {
							userId: savedCustomer._id,
							userName: savedCustomer.name,
							social_unique_id: savedCustomer.social_unique_id,
							branchId: branchId,
							companyId: companyId,
							tableId: tableId,
							floorId: floorId,
							accessType: "guest"
						};

						if (deviceToken) {
							payload.deviceToken = deviceToken;
						}

						Table.findById(tableId, (err, table_detail) => {
							if (err) {
								console.error({
									status: 0,
									message: "Error sending notification, reason: ",
									error: err
								});
								res.status(500).json({
									status: 0,
									message: "Error Sending Notification",
									error: "Error Sending Notification"
								});
							} else {
								//todo: make table engage
								let tableDetail = {
									table_members: table_detail ? table_detail.table_members + 1 : 1,
									total_members: table_detail ? table_detail.total_members + 1 : 1,
									parent_table: true,
									session_status: "active",
									mobile_order: true
								};
	
								tableDetail.members = table_detail ? table_detail.members : [];
	
								// tableDetail.members.push({
								// 	// username: savedCustomer.name,
								// 	user_id: savedCustomer._id.toString(),
								// 	// user_visits: 0
								// });
								tableDetail.members.push(savedCustomer._id.toString());
	
								//TODO: Change the date, get the date from client side
								if (!table_detail.session_started_at) {
									tableDetail.session_started_at = Date.now();
								}
	
								if (table_detail.table_members === 0) {
									TableController.getNextColor(table_detail.branch_id, (color) => {
										tableDetail.table_color = color;
										// tell user if already engaged
										table_detail.set(tableDetail);
										//TODO need to restrict the returning data
										table_detail.save((err, updatedDetails) => {
											if (err) {
												console.error({
													status: 0,
													message: "Error updating table",
													error: err
												});
												res.status(500).json({
													status: 0,
													message: "Error updating table",
													error: err
												});
											} else {
												let token = jwt.sign(payload, "thisissparta");

												socketController.io.sockets.in(branchId).emit('update_table', table_detail)
												res.status(200).json({
													status: 1,
													message: "User Logged In Successfully",
													userId: payload.userId,
													userName: payload.userName,
													sessionStartedAt: updatedDetails.session_started_at,
													token: token
												});

												Push.notifyTableMembers(tableId, { message: 'Table Occupied Successfully'})
												// Push.notifyBranchMembers(branchId,  { message: `Table ${table_detail.name} Occupied`});
												Push.notifyZoneMembers(branchId, table_detail.floor_id, table_detail._id,   { message: `Table ${table_detail.name} Occupied`});




												// Push.notifyTableMembers(tableId, { message: 'Table Occupied Successfully'}).then((result) => {
												// 	let token = jwt.sign(payload, "thisissparta");
												// 	Push.notifyBranchMembers(branchId,  { message: `Table ${table_detail.name} Occupied`}).then((members) => {
												// 		// socketController.io.sockets.in(branchId).emit('table_occupied_mobile', table_detail)
												// 		socketController.io.sockets.in(branchId).emit('update_table', table_detail)
												// 		res.status(200).json({
												// 			status: 1,
												// 			message: "User Logged In Successfully",
												// 			userId: payload.userId,
												// 			userName: payload.userName,
												// 			token: token
												// 		});
												// 	}).catch((error) => {
												// 		res.status(200).json({
												// 			status: 1,
												// 			message: "User Logged In Successfully",
												// 			userId: payload.userId,
												// 			userName: payload.userName,
												// 			token: token
												// 		});
												// 	})
												// }).catch(err => {
												// 	console.error({
												// 		status: 0,
												// 		message: 'getting error while notifying table members',
												// 		error: err
												// 	});
												// 	// res.status(404).json({
												// 	// 	status: 0,
												// 	// 	message: "Error notifying",
												// 	// });
												// 	res.status(200).json({
												// 		status: 1,
												// 		message: "User Logged In Successfully",
												// 		userId: payload.userId,
												// 		userName: payload.userName,
												// 		token: token
												// 	});
												// });
											}
										});
									});
								} else {
									// tell user if already engaged
									table_detail.set(tableDetail);
									//TODO need to restrict the returning data
									table_detail.save((err, updatedDetails) => {
										if (err) {
											console.error({
												status: 0,
												message: "Error updating table",
												error: err
											});
											res.status(500).json({
												status: 0,
												message: "Error updating table",
												error: err
											});
										} else {

											let token = jwt.sign(payload, "thisissparta");
											//NOTE: Commented this since i thisnk it is uncessary to notify members for this
											// Push.notifyBranchMembers(branchId).then((members) => {
												// socketController.io.sockets.in(branchId).emit('table_occupied_mobile', table_detail)
											// }
											socketController.io.sockets.in(branchId).emit('update_table', table_detail)
											res.status(200).json({
												status: 1,
												message: "User Logged In Successfully",
												userId: payload.userId,
												userName: payload.userName,
												sessionStartedAt: updatedDetails.session_started_at,
												token: token
											});

											//user joined table
											let newUserData = {
												user_id: savedCustomer._id,
												username: savedCustomer.name,
												branch_id: branchId,
												table_id: tableId,
											};
											socketController.io.sockets.in(tableId).emit('new_user_table', newUserData); //us
											Push.notifyTableMembers(tableId, { message: 'new user on table'})


										// 	Push.notifyTableMembers(tableId, { message: 'new user on table'}).then((result) => {
										// 		let token = jwt.sign(payload, "thisissparta");
										// 		//NOTE: Commented this since i thisnk it is uncessary to notify members for this
										// 		// Push.notifyBranchMembers(branchId).then((members) => {
										// 			// socketController.io.sockets.in(branchId).emit('table_occupied_mobile', table_detail)
										// 			socketController.io.sockets.in(branchId).emit('update_table', table_detail)
										// 			res.status(200).json({
										// 				status: 1,
										// 				message: "User Logged In Successfully",
										// 				userId: payload.userId,
										// 				userName: payload.userName,
										// 				token: token
										// 			});
	
										// 			//user joined table
										// 			let newUserData = {
										// 				user_id: savedCustomer._id,
										// 				username: savedCustomer.name,
										// 				branch_id: branchId,
										// 				table_id: tableId,
										// 			};
										// 			socketController.io.sockets.in(tableId).emit('new_user_table', newUserData); //us
	
										// 		// }).catch((error) => {
										// 		// 	res.status(200).json({
										// 		// 		status: 1,
										// 		// 		message: "User Logged In Successfully",
										// 		// 		token: token
										// 		// 	});
										// 		// })
										// 	}).catch(err => {
										// 		console.error({
										// 			status: 0,
										// 			message: 'getting error while notifying table members',
										// 			error: err
										// 		});
										// 		// res.status(404).json({
										// 		// 	status: 0,
										// 		// 	message: "Error notifyinh",
										// 		// });
										// 		res.status(200).json({
										// 			status: 1,
										// 			message: "User Logged In Successfully",
										// 			userId: payload.userId,
										// 			userName: payload.userName,
										// 			token: token
										// 		});
										// 	});
										}
									});
								}
							}
						});
					})
					.catch((err) => {
						console.error({
							status: 0,
							message: 'Problem updating customer',
							error: err
						});
						res.status(500).json({
							status: 0,
							message: 'Problem updating customer',
							error: 'Problem with the server'
						});
					})
			}
		})
		.catch(err => {
			console.error({
				status: 0,
				message: "Error finding User",
				error: err
			});
			res.status(500).json({
				status: 0,
				message: "Error finding User",
				error: "Problem with the server"
			});
		});
};

/** 
 * Backup Code
 */
// exports.socialLogin = (req, res) => {
// 	let customerDetails = req.body.customer_details;
// 	let branchId = req.body.branch_id;
// 	let tableId = req.body.table_id ? req.body.table_id : undefined;
// 	let orderId = req.body.order_id ? req.body.order_id : undefined ; 
// 	let floorId = req.body.floor_id ? req.body.floor_id : undefined;        //NOTE: This might change in near future, since floors are not manadtory for branches
// 	let companyId = customerDetails.company_id
// 	let deviceToken = {};

// 	if (customerDetails.device_token) {
// 		deviceToken['endpoint'] = customerDetails.device_token;
// 		deviceToken['application_type'] = customerDetails.application_type ? customerDetails.application_type : 'mobile'; // TODO: Use proper code here!
// 		deviceToken['device_type'] = customerDetails.device_type ? customerDetails.device_type : "android";    //FIXME: Change it to work dinamically
// 	}

// 	Customer.findOne({ email: customerDetails.email, company_id: customerDetails.company_id }, { password: 0 })
// 		.then(async exsistingCustomer => {
// 			if (exsistingCustomer) {
// 				let payload = {
// 					userId: exsistingCustomer._id,
// 					userName: exsistingCustomer.name,
// 					social_unique_id: exsistingCustomer.social_unique_id,
// 					branchId: branchId,
// 					companyId: companyId,
// 					accessType: "guest",
// 				};

// 				if (deviceToken) {
// 					payload.deviceToken = deviceToken;
// 				}

// 				if (deviceToken && !exsistingCustomer.device_token.length) {
// 					exsistingCustomer.device_token.push(deviceToken);
// 					exsistingCustomer.visits++;
// 					exsistingCustomer.save((err, insertedToken) => {
// 						if (err) {
// 							console.error({
// 								status: 0,
// 								message: 'Error saving token',
// 								error: err
// 							});
// 							res.status(400).json({
// 								status: 0,
// 								message: 'Error saving token',
// 								error: 'Problem with user device config'
// 							})
// 						}
// 					})
// 				} else if (deviceToken && exsistingCustomer.device_token.length) {
// 					let ExistinToken = exsistingCustomer.device_token.filter((token) => {
// 						if(deviceToken.application_type === 'mobile') {
// 							if(token.application_type === 'mobile') {
// 								return token.endpoint == deviceToken.endpoint
// 							}
// 						}else if(deviceToken.application_type === 'web') {
// 							if(token.application_type === 'web') {
// 								return token.endpoint.endpoint == deviceToken.endpoint.endpoint
// 							}
// 						}
// 					})

// 					if (!ExistinToken.length) {
// 						/**
// 						 * Emptying the existing customer deive_token below , 
// 						 * since we just want to store only one token at a time
// 						 * If incase if the product owner want multiple device logins remove the emptying thing below
// 						 */
// 						exsistingCustomer.device_token = [];
// 						exsistingCustomer.device_token.push(deviceToken);
// 						exsistingCustomer.visits++;
// 						exsistingCustomer.save((err, insertedToken) => {
// 							if (err) {
// 								console.error({
// 									status: 0,
// 									message: 'error saving token',
// 									error: err
// 								});
// 								res.status(400).json({
// 									status: 0,
// 									message: 'error saving token',
// 									error: 'error with your device config'
// 								});
// 							}
// 						})
// 					} else{
// 						exsistingCustomer.visits++;
// 						exsistingCustomer.save();
// 					}
// 				}

// 				if(tableId) {

// 					let userTableSessions = await Table.find({ branch_id: branchId, _id: { '$ne': tableId }, session_status: 'active', 'members.user_id': (exsistingCustomer._id).toString()  });

// 					if(userTableSessions.length) {
// 						let activeTable = userTableSessions[0]
// 						console.error({
// 							status: 0,
// 							message: 'user active session found',
// 							table_name: activeTable.name ? activeTable.name : '',
// 							error: 'user is active on other table'
// 						});
// 						res.status(401).json({
// 							status: 0,
// 							message: 'user active session found',
// 							table_name: activeTable.name ? activeTable.name : '',
// 							error: 'user is active on other table, please close the session and try again'
// 						});
// 					} else {
// 						Table.findById(tableId, (err, table_detail) => {
// 							if (err) {
// 								console.error({
// 									status: 0,
// 									message: "Error finding Table",
// 									error: err
// 								});
// 								res.status(404).json({
// 									status: 0,
// 									message: "Error finding Table",
// 									error: "Problem with the server"
// 								});
// 							} else {
// 								// tell user if already engaged
// 								let duplicateMembers = table_detail.members.filter((member) => {
// 									// NOTE: Converting toString since it is of object type
// 									if(member.user_id) {
// 										return member.user_id.toString() === exsistingCustomer._id.toString()
// 									}
// 								});
		
// 								if (!duplicateMembers.length) {
// 									let tableDetail = {
// 										table_members: table_detail.table_members
// 											? table_detail.table_members + 1
// 											: 1,
// 										total_members: table_detail.total_members
// 											? table_detail.total_members + 1
// 											: 1,
// 										parent_table: true,
// 										session_status: "active",
// 										mobile_order: true
// 									};
		
// 									tableDetail.members = table_detail.members;
		
// 									tableDetail.members.push({
// 										username: exsistingCustomer.name,
// 										user_id: exsistingCustomer._id.toString(),
// 										user_visits: exsistingCustomer.visits ? exsistingCustomer.visits : 0
// 									});
		
// 									//TODO: Change this time, get time from clientside
// 									if (!table_detail.session_started_at) {
// 										tableDetail.session_started_at = Date.now();
// 									}
		
// 									if (table_detail.table_members === 0) {
// 										TableController.getNextColor(table_detail.branch_id, (color) => {
// 											tableDetail.table_color = color;
// 											table_detail.set(tableDetail);
		
// 											//TODO need to restrict the returning data
// 											table_detail.save((err, updatedDetails) => {
// 												if (err) {
// 													console.error({
// 														status: 0,
// 														message: "Problem Updating Table detail",
// 														error: err
// 													});
// 													res.status(500).json({
// 														status: 0,
// 														message: "Problem Updating Table detail",
// 														error: "Problem with the server"
// 													});
// 												} else {
		
// 													payload.tableId = tableId ? tableId : undefined;
// 													payload.floorId = floorId ? floorId : undefined; 
	
// 													let token = jwt.sign(payload, "thisissparta");
	
// 													socketController.io.sockets.in(branchId).emit('update_table', table_detail)
// 													// /**
// 													//  * Mobile Order Socket to know that there is a new user on the table
// 													//  */
// 													// let socketData = {
// 													// 	table_id: updatedDetails._id,
// 													// 	branch_id: updatedDetails.branch_id,
// 													// 	table_members: updatedDetails.table_members,
// 													// 	total_members: updatedDetails.total_members,
// 													// 	table_amount: updatedDetails.table_amount,
// 													// 	total_amount: updatedDetails.total_amount,
// 													// 	socket_data: 'new_table_member'
// 													// }
// 													// socketController.io.sockets.in(updatedDetails._id).emit('update_table', socketData)
// 													res.status(200).json({
// 														status: 1,
// 														message: "User Logged In Successfully",
// 														userId: payload.userId,
// 														userName: payload.userName,
// 														sessionStartedAt: updatedDetails.session_started_at,
// 														token: token
// 													});

// 													Push.notifyTableMembers(tableId, { message: 'Table Occupied Successfully' })
// 													Push.notifyBranchMembers(branchId, { message: `Table ${table_detail.name} Occupied` })


// 													// Push.notifyTableMembers(tableId, { message: 'Table Occupied Successfully' }).then((result) => {
// 													// 	Push.notifyBranchMembers(branchId, { message: `Table ${table_detail.name} Occupied` }).then((members) => {
// 													// 		// socketController.io.sockets.in(branchId).emit('table_occupied_mobile', table_detail);
// 													// 		res.status(200).json({
// 													// 			status: 1,
// 													// 			message: "User Logged In Successfully",
// 													// 			userId: payload.userId,
// 													// 			userName: payload.userName,
// 													// 			sessionStartedAt: updatedDetails.session_started_at,
// 													// 			token: token
// 													// 		});
// 													// 	}).catch((error) => {
// 													// 		res.status(200).json({
// 													// 			status: 1,
// 													// 			message: "User Logged In Successfully",
// 													// 			userId: payload.userId,
// 													// 			userName: payload.userName,
// 													// 			sessionStartedAt: updatedDetails.session_started_at,
// 													// 			token: token
// 													// 		});
// 													// 	});
// 													// }).catch((err) => {
// 													// 	res.status(200).json({
// 													// 		status: 1,
// 													// 		message: 'Problem Notifying all users',
// 													// 		userId: payload.userId,
// 													// 		userName: payload.userName,
// 													// 		sessionStartedAt: updatedDetails.session_started_at,
// 													// 		token: token
// 													// 	})
// 													// })
		
// 												}
		
// 											});
// 										})
// 									} else {
// 										table_detail.set(tableDetail);
		
// 										//TODO need to restrict the returning data
// 										table_detail.save((err, updatedDetails) => {
// 											if (err) {
// 												console.error({
// 													status: 0,
// 													message: "Problem Updating Table detail",
// 													error: err
// 												});
// 												res.status(500).json({
// 													status: 0,
// 													message: "Problem Updating Table detail",
// 													error: "Problem with the server"
// 												});
// 											} else {
// 												payload.tableId = tableId ? tableId : undefined;
// 												payload.floorId = floorId ? floorId : undefined;
												
// 												let token = jwt.sign(payload, "thisissparta");
		
// 												// socketController.io.sockets.in(branchId).emit('update_table', table_detail)
// 												/**
// 												 * Mobile User socket for more than one user
// 												 */
// 												let socketData = {
// 													table_id: updatedDetails._id,
// 													floor_id: updatedDetails.floor_id ? updatedDetails.floor_id : undefined,
// 													branch_id: updatedDetails.branch_id,
// 													members: updatedDetails.members,
// 													table_members: updatedDetails.table_members,
// 													total_members: updatedDetails.total_members,
// 													table_amount: updatedDetails.table_amount,
// 													total_amount: updatedDetails.total_amount,
// 													socket_data: 'new_table_member'
// 												}
// 												socketController.io.sockets.in(updatedDetails._id).emit('update_table', socketData);
	
// 												socketController.io.sockets.in(branchId).emit('update_table', socketData) //will be helpful in notifying branch
	
// 												let newUserData = {
// 													user_id: exsistingCustomer._id,
// 													username: exsistingCustomer.name,
// 													branch_id: branchId,
// 													table_id: tableId
// 												};
// 												socketController.io.sockets.in(tableId).emit('new_user_table', newUserData); //user joined table
												
// 												res.status(200).json({
// 													status: 1,
// 													message: "User Logged In Successfully",
// 													userId: payload.userId,
// 													userName: payload.userName,
// 													sessionStartedAt: updatedDetails.session_started_at,
// 													token: token
// 												});

// 												Push.notifyTableMembers(tableId, { message: 'new member on table'})

// 												// Push.notifyTableMembers(tableId, { message: 'new member on table'}).then((result) => {
// 												// 	//NOTE: Commented this notification since I think it is unnecessary to notify branch members for this
// 												// 	// remove the comments if u want this option
// 												// 	// Push.notifyBranchMembers(branchId, { message: 'new members added on table'}).then((members) => {
// 												// 		// socketController.io.sockets.in(branchId).emit('table_occupied_mobile', table_detail)
// 												// 		// socketController.io.sockets.in(branchId).emit('update_table', table_detail)
// 												// 		res.status(200).json({
// 												// 			status: 1,
// 												// 			message: "User Logged In Successfully",
// 												// 			userId: payload.userId,
// 												// 			userName: payload.userName,
// 												// 			sessionStartedAt: updatedDetails.session_started_at,
// 												// 			token: token
// 												// 		});
// 												// 	// }).catch((error) => {
// 												// 	// 	res.status(200).json({
// 												// 	// 		status: 1,
// 												// 	// 		message: "User Logged In Successfully",
// 												// 	// 		token: token
// 												// 	// 	});
// 												// 	// });
// 												// }).catch((err) => {
// 												// 	res.status(200).json({
// 												// 		status: 1,
// 												// 		message: 'Problem Notifying all users',
// 												// 		userId: payload.userId,
// 												// 		userName: payload.userName,
// 												// 		sessionStartedAt: updatedDetails.session_started_at,
// 												// 		token: token
// 												// 	})
// 												// })
		
// 											}
// 										});
// 									}
// 								} else {
// 									payload.tableId = tableId ? tableId : undefined;
// 									payload.floorId = floorId ? floorId : undefined;
// 									let token = jwt.sign(payload, "thisissparta");
	
// 									res.status(200).json({
// 										status: 1,
// 										message: 'User Logged in Successfully',
// 										userId: payload.userId,
// 										userName: payload.userName,
// 										sessionStartedAt: table_detail.session_started_at,
// 										token: token
// 									})
// 								}
// 							}
// 						});
// 					}
// 				}else if(orderId) {
// 					payload.orderId = orderId ? orderId : undefined;
// 					let token = jwt.sign(payload, "thisissparta");
	
// 					socketController.io.sockets.in(branchId).emit('update_takeaway', { branch_id : payload.branchId });

// 					Push.notifyBranchMembers(branchId, { message: `New Takeaway order` }).then((members) => { 
// 						res.status(200).json({
// 							status: 1,
// 							message: 'User Logged in Successfully',
// 							userId: payload.userId,
// 							userName: payload.userName,
// 							// sessionStartedAt: Date.now(),
// 							token: token
// 						})
// 					});
// 				}else{
// 					console.error({
// 						status: 0,
// 						message: 'Invalid Parameters',
// 						error: 'please pass table or order id'
// 					});
// 					res.status(400).json({
// 						status: 0,
// 						message: 'Invalid Parameters, Please pass order or table id',
// 					});
// 				}
// 				// after engaging table inform branch members and admin
// 			} else {
// 				customerDetails["registered_by"] = customerDetails.third_party_provider;
// 				customerDetails['contact_number'] = customerDetails['mobile'] ? customerDetails['mobile'] : customerDetails['contact_number']; // this will help to assign mobile param with
// 				let customer = new Customer(customerDetails);
// 				customer.device_token = []

// 				if (deviceToken) {
// 					customer.device_token.push(deviceToken)
// 				}

// 				customer
// 					.save()
// 					.then(savedCustomer => {
// 						let payload = {
// 							userId: savedCustomer._id,
// 							userName: savedCustomer.name,
// 							social_unique_id: savedCustomer.social_unique_id,
// 							branchId: branchId,
// 							companyId: companyId,
// 							tableId: tableId,
// 							floorId: floorId,
// 							accessType: "guest"
// 						};

// 						if (deviceToken) {
// 							payload.deviceToken = deviceToken;
// 						}

// 						Table.findById(tableId, (err, table_detail) => {
// 							if (err) {
// 								console.error({
// 									status: 0,
// 									message: "Error sending notification, reason: ",
// 									error: err
// 								});
// 								res.status(500).json({
// 									status: 0,
// 									message: "Error Sending Notification",
// 									error: "Error Sending Notification"
// 								});
// 							} else {
// 								//todo: make table engage
// 								let tableDetail = {
// 									table_members: table_detail ? table_detail.table_members + 1 : 1,
// 									total_members: table_detail ? table_detail.total_members + 1 : 1,
// 									parent_table: true,
// 									session_status: "active",
// 									mobile_order: true
// 								};
	
// 								tableDetail.members = table_detail ? table_detail.members : [];
	
// 								tableDetail.members.push({
// 									username: savedCustomer.name,
// 									user_id: savedCustomer._id.toString(),
// 									user_visits: 0
// 								});
	
// 								//TODO: Change the date, get the date from client side
// 								if (!table_detail.session_started_at) {
// 									tableDetail.session_started_at = Date.now();
// 								}
	
// 								if (table_detail.table_members === 0) {
// 									TableController.getNextColor(table_detail.branch_id, (color) => {
// 										tableDetail.table_color = color;
// 										// tell user if already engaged
// 										table_detail.set(tableDetail);
// 										//TODO need to restrict the returning data
// 										table_detail.save((err, updatedDetails) => {
// 											if (err) {
// 												console.error({
// 													status: 0,
// 													message: "Error updating table",
// 													error: err
// 												});
// 												res.status(500).json({
// 													status: 0,
// 													message: "Error updating table",
// 													error: err
// 												});
// 											} else {
// 												let token = jwt.sign(payload, "thisissparta");

// 												socketController.io.sockets.in(branchId).emit('update_table', table_detail)
// 												res.status(200).json({
// 													status: 1,
// 													message: "User Logged In Successfully",
// 													userId: payload.userId,
// 													userName: payload.userName,
// 													sessionStartedAt: updatedDetails.session_started_at,
// 													token: token
// 												});

// 												Push.notifyTableMembers(tableId, { message: 'Table Occupied Successfully'})
// 												Push.notifyBranchMembers(branchId,  { message: `Table ${table_detail.name} Occupied`});




// 												// Push.notifyTableMembers(tableId, { message: 'Table Occupied Successfully'}).then((result) => {
// 												// 	let token = jwt.sign(payload, "thisissparta");
// 												// 	Push.notifyBranchMembers(branchId,  { message: `Table ${table_detail.name} Occupied`}).then((members) => {
// 												// 		// socketController.io.sockets.in(branchId).emit('table_occupied_mobile', table_detail)
// 												// 		socketController.io.sockets.in(branchId).emit('update_table', table_detail)
// 												// 		res.status(200).json({
// 												// 			status: 1,
// 												// 			message: "User Logged In Successfully",
// 												// 			userId: payload.userId,
// 												// 			userName: payload.userName,
// 												// 			token: token
// 												// 		});
// 												// 	}).catch((error) => {
// 												// 		res.status(200).json({
// 												// 			status: 1,
// 												// 			message: "User Logged In Successfully",
// 												// 			userId: payload.userId,
// 												// 			userName: payload.userName,
// 												// 			token: token
// 												// 		});
// 												// 	})
// 												// }).catch(err => {
// 												// 	console.error({
// 												// 		status: 0,
// 												// 		message: 'getting error while notifying table members',
// 												// 		error: err
// 												// 	});
// 												// 	// res.status(404).json({
// 												// 	// 	status: 0,
// 												// 	// 	message: "Error notifying",
// 												// 	// });
// 												// 	res.status(200).json({
// 												// 		status: 1,
// 												// 		message: "User Logged In Successfully",
// 												// 		userId: payload.userId,
// 												// 		userName: payload.userName,
// 												// 		token: token
// 												// 	});
// 												// });
// 											}
// 										});
// 									});
// 								} else {
// 									// tell user if already engaged
// 									table_detail.set(tableDetail);
// 									//TODO need to restrict the returning data
// 									table_detail.save((err, updatedDetails) => {
// 										if (err) {
// 											console.error({
// 												status: 0,
// 												message: "Error updating table",
// 												error: err
// 											});
// 											res.status(500).json({
// 												status: 0,
// 												message: "Error updating table",
// 												error: err
// 											});
// 										} else {

// 											let token = jwt.sign(payload, "thisissparta");
// 											//NOTE: Commented this since i thisnk it is uncessary to notify members for this
// 											// Push.notifyBranchMembers(branchId).then((members) => {
// 												// socketController.io.sockets.in(branchId).emit('table_occupied_mobile', table_detail)
// 											// }
// 											socketController.io.sockets.in(branchId).emit('update_table', table_detail)
// 											res.status(200).json({
// 												status: 1,
// 												message: "User Logged In Successfully",
// 												userId: payload.userId,
// 												userName: payload.userName,
// 												sessionStartedAt: updatedDetails.session_started_at,
// 												token: token
// 											});

// 											//user joined table
// 											let newUserData = {
// 												user_id: savedCustomer._id,
// 												username: savedCustomer.name,
// 												branch_id: branchId,
// 												table_id: tableId,
// 											};
// 											socketController.io.sockets.in(tableId).emit('new_user_table', newUserData); //us
// 											Push.notifyTableMembers(tableId, { message: 'new user on table'})


// 										// 	Push.notifyTableMembers(tableId, { message: 'new user on table'}).then((result) => {
// 										// 		let token = jwt.sign(payload, "thisissparta");
// 										// 		//NOTE: Commented this since i thisnk it is uncessary to notify members for this
// 										// 		// Push.notifyBranchMembers(branchId).then((members) => {
// 										// 			// socketController.io.sockets.in(branchId).emit('table_occupied_mobile', table_detail)
// 										// 			socketController.io.sockets.in(branchId).emit('update_table', table_detail)
// 										// 			res.status(200).json({
// 										// 				status: 1,
// 										// 				message: "User Logged In Successfully",
// 										// 				userId: payload.userId,
// 										// 				userName: payload.userName,
// 										// 				token: token
// 										// 			});
	
// 										// 			//user joined table
// 										// 			let newUserData = {
// 										// 				user_id: savedCustomer._id,
// 										// 				username: savedCustomer.name,
// 										// 				branch_id: branchId,
// 										// 				table_id: tableId,
// 										// 			};
// 										// 			socketController.io.sockets.in(tableId).emit('new_user_table', newUserData); //us
	
// 										// 		// }).catch((error) => {
// 										// 		// 	res.status(200).json({
// 										// 		// 		status: 1,
// 										// 		// 		message: "User Logged In Successfully",
// 										// 		// 		token: token
// 										// 		// 	});
// 										// 		// })
// 										// 	}).catch(err => {
// 										// 		console.error({
// 										// 			status: 0,
// 										// 			message: 'getting error while notifying table members',
// 										// 			error: err
// 										// 		});
// 										// 		// res.status(404).json({
// 										// 		// 	status: 0,
// 										// 		// 	message: "Error notifyinh",
// 										// 		// });
// 										// 		res.status(200).json({
// 										// 			status: 1,
// 										// 			message: "User Logged In Successfully",
// 										// 			userId: payload.userId,
// 										// 			userName: payload.userName,
// 										// 			token: token
// 										// 		});
// 										// 	});
// 										}
// 									});
// 								}
// 							}
// 						});
// 					})
// 					.catch((err) => {
// 						console.error({
// 							status: 0,
// 							message: 'Problem updating customer',
// 							error: err
// 						});
// 						res.status(500).json({
// 							status: 0,
// 							message: 'Problem updating customer',
// 							error: 'Problem with the server'
// 						});
// 					})
// 			}
// 		})
// 		.catch(err => {
// 			console.error({
// 				status: 0,
// 				message: "Error finding User",
// 				error: err
// 			});
// 			res.status(500).json({
// 				status: 0,
// 				message: "Error finding User",
// 				error: "Problem with the server"
// 			});
// 		});
// };

/**
 * Action: This will only increase the visit count of the customer
 */
exports.IncreaseVisit = (req, res) => {
	Customer.findOneAndUpdate(
		{ _id: req.params.customerId },
		{ $inc: { visits: 1 } },
		(err, updatedResult) => {
			if (err) {
				console.error({
					status: 0,
					message: "Error updating Customer",
					error: err
				});
				res.status(404).json({
					status: 0,
					message: "Error updating item",
					error: "Error Updating Customer"
				});
			} else {
				res.status(201).json({
					status: 1,
					message: "Customer Updated Successfully",
					customer: updatedResult
				});
			}
		}
	);
};

// exports.Notify = (data) => {
//     User.find({ "branch_id": data.branchId }, { push_tokens: true, _id: false }, (err, usersWithToken) => {

//         const notificationPayload = {
//             "notification": {
//                 "title": "Dinamic POS",
//                 "body": `Table engaged Successfullt`,
//                 "icon": "assets/icons/icon-144x144.png",
//                 "vibrate": [100, 50, 100],
//                 "type": data.action,
//                 "data": {
//                     "dateOfArrival": Date.now(),
//                     "primaryKey": 1,
//                     "content": "table",
//                 },
//                 "actions": [
//                     { "action": "explore", "title": "Go to the site" }
//                     // can add more options with icons, sample is given below
//                     // { "action": "yes", "title": "Yes", "icon": "images/yes.png" },
//                     // { "action": "no", "title": "No", "icon": "images/no.png" }
//                 ]
//             }
//         };

//         Promise.all(usersWithToken.map(sub => webpush.sendNotification(
//             sub.push_tokens, JSON.stringify(notificationPayload))))
//             .then(() => {
//                 // res.status(200).json({
//                 //     message: 'Notification sent successfully.',
//                 //     status: 1
//                 // })
//                 let token = jwt.sign(payload, "thisissparta");
//                 res.status(200).json({ status: 1, message: "User Logged In Successfully", token: token });
//             })
//             .catch(err => {
//                 console.error("Error sending notification, reason: ", err);
//                 res.sendStatus(500);
//             });

//     });

// }

/**
 * NOTE: This method will regerate token
 * This will be helpful when the user wants to reorder
 */
exports.regenerateToken = (req, res) => {
	let payload = {
		userId: req.userId ? req.userId : '',
		userName: req.userName ? req.userName : '',
		social_unique_id: req.social_unique_id ? req.social_unique_id : '',
		branchId: req.branchId ? req.branchId :  '',
		accessType: req.accessType ? req.accessType : "guest",
	};

	// let payload 
	// if(req.params.typeId && req.params.typeId.startsWith('TA') ) {
	// if(req.params.typeId ) {
	// 	payload.orderId = req.params.typeId;
	// }
	if(req.orderId) {
		let now = new Date();

		let timestamp = now.getFullYear().toString(); // 2011
		timestamp += (now.getMonth() < 9 ? '0' : '') + now.getMonth().toString(); // JS months are 0-based, so +1 and pad with 0's
		timestamp += (now.getDate() < 10 ? '0' : '') + now.getDate().toString(); // pad with a 0
		timestamp += (now.getHours() < 10 ? '0' : '') + now.getHours().toString(); // pad with a 0
		timestamp += (now.getMinutes() < 10 ? '0' : '') + now.getMinutes().toString(); // pad with a 0
		timestamp += (now.getSeconds() < 10 ? '0' : '') + now.getSeconds().toString(); // pad with a 0
		timestamp += (now.getMilliseconds() < 10 ? '0' : '') + now.getMilliseconds().toString(); // pad with a 0
		// ... etc... with .getHours(), getMinutes(), getSeconds(), getMilliseconds()
		// return `TA${timestamp}`;
		payload.orderId = `TA${timestamp}`;
	}

	if (req.deviceToken) {
		payload.deviceToken = req.deviceToken;
	}

	let token = jwt.sign(payload, "thisissparta");
	res.status(200).json({
		status: 1,
		message: 'token updated successfully',
		token: token
	});

}