"use strict";

/**
 * Dependency Modules
 */
const FinanceLookupModel = require("../models/finance_lookup.model");
const MenuItemModel = require('../models/managementModels/menu_item.model');

/**
 * Finance Type API
 */

/**
 * Get Finance Type (Company)
 * @requires companyId
 */
exports.list_finance_types_company = (req, res) => {
	FinanceLookupModel.findOne({ company_id: req.companyId }, (err, f_lookup) => {
		if (err) {
			console.error({ 
				status:0, 
				message: "Error Occured in finding Finance Table", 
				error: err
			});
			res.status(500).json({ 
				status: 0,
				message: "Error Occured in finding Finance Table",
				error: "Problem with the server"
			});
		}
		res.status(200).json({ 
			status: 1, 
			message: "Finance Details Obtained Successfully",  
			finance_detail: f_lookup 
		});
	});
};

/**
 * Finance List (Branch, Company)
 */
exports.list_finance_types = (req, res) => {
	let query_value = '';
	if(req.accessType === "superadmin" || req.accessType === "admin" || req.accessType === "staffs") {
		query_value = req.params.branchId;
	}else{
		res.status(401).json({ 
			status: 0,  
			message: 'permission denied',
			error: 'Unauthorized access'
		});
	}
	FinanceLookupModel.findOne({ branch_id: query_value }, (err, f_lookup) => {
		if (err) {
			console.error({ 
				status: 0, 
				message: "Problem getting finance details", 
				error: err
			});
			res.status(500).json({ 
				status: 0,
				message: "Problem getting finance details",
				error: "Problem with the server"
			});
		}else{
			res.status(200).json({ 
				status: 1, 
				message: "Finance Details Obtained Successfully",  
				finance_detail : f_lookup
			});
		}
	});
};

/**
 * Depricated
 * Finace Lookup update(Branch, Company)
 * @requires branchid
 */
exports.add_finance_type = (req, res) => {
	let financeLookupData = [];
	financeLookupData.company_id = req.companyId;
	if (req.accessType === "superadmin" || req.accessType === "admin" || req.accessType === "staffs") {
		financeLookupData.branch_id = req.branch_id;
	} else {
		req.status(401).json({ 
			status: 0,
			message: 'Permission denied',
			error: 'Unauthorised Access '
	    });
	}

	financeLookupData.tender_types = req.body.tender_types;
	financeLookupData.tax_rates = req.body.tax_rates;
	financeLookupData.petty_cash_reasons = req.body.petty_cash_reasons;

	let finance_lookup_model = new FinanceLookupModel(financeLookupData);
	finance_lookup_model.save((err, finaceLookup) => {
		if (err) {
			res.status(404).json({
			status:0 ,
			message: 'Error saving finance lookup',
			error: err})
		};
		res.status(200).json({
			status: 1,
			message: "Finance Detail saved successfully",
			finance_detail: finaceLookup
		});
	});
};

/**
 * Financial Update (Tender Type) (Branch)
 * @requires branchId
 * @requires tenderDetails
 */
exports.update_tender_type = (req, res) => {
	let updateData = req.body.tender_detail;
	let query_value = '';
	if (req.accessType === "superadmin" || req.accessType === "admin" || req.accessType === "staffs") {
		query_value = updateData.branch_id;
	} else {
		req.status(401).json({
			status: 0, 
			message: 'permission denied',
			error: 'Unauthorised Access' 
		});
	}
	if (!updateData._id) {
		FinanceLookupModel.update(
			{ branch_id: query_value },
			{
				$push: { tender_types: updateData }
			},
			{ new: true, upsert: true },
			function (err, result) {
				if (err)  {
					console.error({
						status: 0,
						message: "Error adding new tender", 
						error: err
					});
					res.status(500).json({ 
						status: 0,
						message: "Error adding new tender",
						error: "Problem with the server"
					});
				}
				res.status(201).json({
					status: 1,
					message: "Finace Detail added successfully",
					finance_detail: result
				});
			}
		);
	} else if (updateData._id) {
		FinanceLookupModel.update(
			{ "tender_types._id": updateData._id },
			{
				$set: { "tender_types.$": updateData }
			},
			function (err, result) {
				if (err) {
					console.error({
						status: 0,
						message: "Error updating tender type", 
						error: err
					});
					res.status(500).json({ 
						status: 0,
						message: "Error updating tender type",
						error: "Problem with the server"
					});
				}
				res.status(201).json({
					status: 1 ,
					message: "Finace Detail Updated Successfully",
					finance_detail: result
				});
			}
		);
	}
};

/**
 * Fincace Update (Tender Type)
 * @requires tenderId
 */
exports.remove_tender_type = (req, res) => {
	if (req.accessType === "superadmin" || req.accessType === "admin" || req.accessType === "staffs") {
		let updateData = req.body.tender_detail;

		if (updateData._id) {
			FinanceLookupModel.update(
				{ "tender_types._id": updateData._id },
				{
					// $set: {
					// 	"tender_types.$.status": updateData.status
					// }
					$pull: { 
						"tender_types": {  "_id": updateData._id  }
					}
				},
				(err, result) => {
					if (err) {
						console.error({
							status: 0,
							message: "Error removing tender detail", 
							error: err
						});
						res.status(500).json({ 
							status: 0,
							message: "Error removing tender detail",
							error: "Problem with the server"
						});
					}
					res.status(201).json({
						status: 1,
						message: "Tender Removed succesfully",
						finance_detail: result
					});
				}
			);
		} else if (!updateData._id) {
			res.status(404).json({
				status: 0 ,
				message: "No tender type found",
				error: "invalid parameter"
			});
		}
	} else {
		res.status(401).json({ 
			status: 0,
			message: 'permission denied',
			error: 'Unauthorised Access' 
		});
	}
};

/**
 * Finance Update (Tax id)
 * @requires taxId
 */
exports.update_tax_rate = (req, res) => {
	let updateData = req.body.tax_rate_detail;
	let query_value = '';
	if (req.accessType === "superadmin" || req.accessType === "admin" || req.accessType === "staffs") {
		query_value = updateData.branch_id;
	} else {
		req.status(401).json({ 
			status: 0,
			message: 'permission denied',
			error: 'Unauthorised access' 
		});
	}
	if (!updateData._id) {
		// ACTION: No ID present, it'll be considered as new tax request
		FinanceLookupModel.findOne({ branch_id: updateData.branch_id, "tax_rates.tax_type": updateData.tax_type }, (err, existingTaxRate) => {
			if(err) {
				console.error({
					status: 0,
					message: "Error adding new tax rate", 
					error: err
				});
				res.status(500).json({ 
					status: 0,
					message: "Error adding new tax rate",
					error: "Problem with the server"
				});
			} else if(existingTaxRate) {
				console.error({
					status: 0,
					message: "tax type with same name already exists",
					error: "invalid parameters"
				});
				res.status(400).json({ 
					status: 0,
					message: "tax type with same name already exists",
					error: "invalid parameters"
				});
			} else{
				FinanceLookupModel.update(
					{ branch_id: query_value },
					{
						$push: { tax_rates: updateData }
					},
					{ new: true, upsert: true },
					async (err, result) => {
						if (err) {
							console.error({
								status: 0,
								message: "Error adding new tax rate", 
								error: err
							});
							res.status(500).json({ 
								status: 0,
								message: "Error adding new tax rate",
								error: "Problem with the server"
							});
						} else {
							await MenuItemModel.updateMany(
								{ branch_id: updateData.branch_id , is_applied_tax: true },
								{ 
									$push: { tax_rates: updateData }
								}
							)
							res.status(201).json({
								status: 1,
								message: "Tax added successfully",
								result: result
							});
						}
					}
				);
			}
		})
	} else if (updateData._id) {
		// ACTION: ID present, it'll be considered as existing tax update request
		FinanceLookupModel.findOne({ branch_id: updateData.branch_id }, (err, existingTaxRate) => {
			if(err) {
				console.error({
					status: 0,
					message: "Error updating tax rate", 
					error: err 
				});
				res.status(500).json({ 
					status: 0,
					message: "Error updating tax rate",
					error: "Problem with the server"
				});
			} else if(!existingTaxRate) {
				console.error({
					status: 0,
					message: "no tax rates available for this branch", 
					error: 'invalid parameters' 
				});
				res.status(400).json({ 
					status: 0,
					message: "no tax rates available for this branch", 
					error: 'invalid parameters' 
				});
			} else {

				let eTaxRate = existingTaxRate.tax_rates.filter(tax_rate => {
					if(tax_rate._id != updateData._id && tax_rate.tax_type == updateData.tax_type) {
						return tax_rate;
					}
				});

				if(eTaxRate.length) {
					console.error({
						status: 0,
						message: "tax type with same name already exists", 
						error: 'invalid parameters' 
					});
					res.status(400).json({ 
						status: 0,
						message: "tax type with same name already exists", 
						error: 'invalid parameters' 
					});
				} else{
					FinanceLookupModel.update(
						{ "tax_rates._id": updateData._id },
						{
							$set: { "tax_rates.$": updateData }
						},
						async (err, result) => {
							if (err) { 
								console.error({
									status: 0,
									message: "Error updating tax rate", 
									error: err 
								});
								res.status(500).json({ 
									status: 0,
									message: "Error updating tax rate",
									error: "Problem with the server"
								});
							}else{
								let tax_array = existingTaxRate.tax_rates;
								let selectedTaxHistory = await tax_array.filter((tax) => tax._id == updateData._id);
								if(selectedTaxHistory.length) {
									/**
									 * The below code will update the items which are having the same tax_type 
									 * on the same branch when the branch's taxtype or percentage get updated
									 */
									await MenuItemModel.updateMany({ branch_id: updateData.branch_id, "tax_rates.tax_type" : selectedTaxHistory[0].tax_type },
									{ 
										$set: {
											"tax_rates.$.tax_type" : updateData.tax_type , "tax_rates.$.percentage" :  updateData.percentage 
										}
									})
									res.status(201).json({
										status: 1,
										message: "Tax updated successfully",
										result: result
									});
								}
								
							}
						}
					);
				}
			}
		})
 
	
	}
};

/**
 * Finance remove (tax rate)
 * @param taxId
 */
exports.remove_tax_rate = (req, res) => {
	if (req.accessType === "superadmin" || req.accessType === "admin" || req.accessType === "staffs") {
		let updateData = req.body.tax_rate_detail;
		if (updateData._id) {
			FinanceLookupModel.update(
				{ "tax_rates._id": updateData._id },
				{
					$pull: { 
						"tax_rates": {  "_id": updateData._id  }
					}
				},
				async (err, result) => {
					if (err) {
						console.error({
							status: 0,
							message: "Error removing tax rates", 
							error: err
						});
						res.status(500).json({ 
							status: 0,
							message: "Error removing tax rates",
							error: "Problem with the server"
						});
					} else{
						/**
						 * The below code will update the items which are having the same tax_type 
						 * on the same branch when the branch's taxtype or percentage get updated
						 */
						await MenuItemModel.updateMany({ branch_id: updateData.branch_id, "tax_rates.tax_type" : updateData.tax_type },
						{ 
							$pull: { 
								"tax_rates": {  "tax_type": updateData.tax_type }
							}
						})
						res.status(201).json({
							status: 1,
							message: "Tax removed successfully",
							result: result
						});
					}
					
				}
			);
		} else if (!updateData._id) {
			res.status(404).json({
				status: 0,
				message: "No tax rate found",
				error: "Invalid parameter"
			});
		}
	} else {
		res.status(401).json({ 
			status: 0,
			message: 'permission denied',
			error: 'Unauthorised Access'
		});
	}
};

/**
 * Finance Update (Petty Cash)
 * @requires cashId
 */
exports.update_petty_cash = (req, res) => {
	let updateData = req.body.petty_cash_detail;
	let query_value = '';
	if (req.accessType === "superadmin" || req.accessType === "admin" || req.accessType === "staffs") {
		query_value = updateData.branch_id;
	} else {
		res.status(401).json({
			status: 0,
			message: 'permission denied',
			error: 'Unauthorised access' });
	}
	if (!updateData._id) {
		FinanceLookupModel.update(
			{ branch_id: query_value },
			{
				$push: { petty_cash_reasons: updateData }
			},
			{ new: true, upsert: true },
			function (err, result) {
				if (err) {
					console.error({
						status: 0,
						message: "Error adding new petty cash reason", 
						error: err
					})
					res.status(500).json({ 
						status: 0,
						message: "Error adding new petty cash reason",
						error: "Problem with the server"
					});
				};
				res.status(201).json({
					status: 1,
					message: "Petty Cash added successfully",
					result: result
				});
			}
		);
	} else if (updateData._id) {
		FinanceLookupModel.update(
			{ "petty_cash_reasons._id": updateData._id },
			{
				$set: { "petty_cash_reasons.$": updateData }
			},
			function (err, result) {
				if (err) {
					console.error({
						status: 0,
						message: "Error updating petty cash reason",
						error: err
					});
					res.status(500).json({ 
						status: 0,
						message: "Error updating petty cash reason",
						error: "Problem with the server"
					});
				}
				res.status(201).json({
					status: 1,
					message: "Petty Cash updated successfully",
					result: result
				});
			}
		);
	}
};

/**
 * Finace Remove (Petty cash)
 * @param cashId
 */
exports.remove_petty_cash = (req, res) => {
	if (req.accessType === "superadmin" || req.accessType === "admin" || req.accessType === "staffs") {
		let updateData = req.body.petty_cash_detail;
		if (updateData._id) {
			FinanceLookupModel.update(
				{ "petty_cash_reasons._id": updateData._id },
				{
					// $set: {
					// 	"petty_cash_reasons.$.status": updateData.status
					// }
					$pull: { 
						"petty_cash_reasons": {  "_id": updateData._id  }
					}
				},
				(err, result) => {
					if (err) {
						console.error({
							status: 0 ,
							message: "Error removing petty cash reason", 
							error: err
						});
						res.status(500).json({ 
							status: 0,
							message: "Error removing petty cash reason",
							error: "Problem with the server"
						});
					}
					res.status(201).json({ 
						status: 1,
						message: "Petty Cash deleted successfully",
						result: result
					});
				}
			);
		} else if (!updateData._id) {
			res.status(404).json({
				status: 0,
				message: "No Petty cash found",
				error: "Invalid paramter"
			});
		}
	} else {
		res.status(401).json({ 
			status: 0,
			message: 'permission denied',
			error: 'Unauthorised access' 
		});
	}
};
