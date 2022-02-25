'use strict';
const stockLocationModel = require('./../../../models/managementModels/inventory/stock_location.model');

//NOTE: This will return categories of a particular branch
//TODO: Rename it to get branchCategory
exports.getStockLocations = (req, res) => {
	let branchId;
	if (req.accessType === 'superadmin' || req.accessType === 'admin' || req.accessType === 'staffs') {
		branchId = req.params.branchId;
		getLocations();
	} else {
		res.status(401).json({ 
            status: 0,
			message: 'Unautorized Access',
            error: 'Access Denied'
        });
	}

	function getLocations() {
		stockLocationModel.find({ branch_id: branchId }, async (err, locations) => {
			if (err) {
				res.status(500).json({
					status: 0,
					message: 'error finding stock locations',
					error: 'problem with the server'
				});
			} else {
				if(locations.length) {
					res.status(200).json({
						status: 1,
						message: 'locations obtained successfully',
						data: locations
					});
				}else{
					res.status(200).json({
						status: 1,
						message: 'no locations created',
						data: locations
					});
				}
			}
		})
	}
};

exports.getStockLocation = (req, res) => {
    //TODO need to return a particualr category (use $elementMatch)
    let locationId;
	if (req.accessType === 'superadmin' || req.accessType === 'admin' || req.accessType === 'staffs') {
		locationId = req.params.locationId;
		getLocation();
	} else {
		res.status(401).json({ 
            status: 0,
			message: 'Unautorized Access',
            error: 'Access Denied'
        });
    }
    
    function getLocation() {
        stockLocationModel.findOne({ '_id': locationId }, function (err, location) {
            if (err) {
                res.status(400).json({
                    status: 0,
                    message: 'error getting location',
                    error: 'problem with the server'
                });
            } else {
                res.status(200).json({
                    status: 0,
                    message: 'location obtained successfully',
                    data: location
                });
            }
        });
    }
};

exports.updateStockLocation = (req, res) => {
	let updateData = req.body.location_details;

	if (req.accessType === "superadmin" || req.accessType === "admin" || req.accessType === "staffs") {
		// let branchId = updateData.branch_id;
            
        if(!updateData._id) {
			//TODO: Existing location, Update it
			let stockLocation = new stockLocationModel(updateData);
			stockLocation.company_id = req.companyId;
			stockLocation.save().then((result) =>{
				res.status(201).json({
					status: 1,
					message: "stock location created successfully"
				});
			}).catch((err) => {
				console.error({
					status: 0,
					message: "error adding location",
					error: err
				});
				res.status(500).json({
					status: 0,
					message: "error adding location",
					error: 'problem with the server'
				});
			})
        }else {
			//TODO:new location save it
			stockLocationModel.findOne({ _id: updateData._id },  (err, stockLocation) =>{
				if(err) {
					console.error({
						status: 0,
						message: "error adding location",
						error: err
					});
					res.status(500).json({
						status: 0,
						message: "error adding location",
						error: 'problem with the server'
					});
				}else if(!stockLocation){
					console.error({
						status: 0,
						message: "location does not exists",
						error: 'invalid location'
					});
					res.status(404).json({
						status: 0,
						message: "location does not exists",
						error: 'invalid location'
					});
				}else {
					stockLocation.set(updateData);
					stockLocation.save().then(() => {
						res.status(201).json({
							status: 1,
							message: "stock location updated successfully"
						});
					}).catch((err) => {
						console.error({
							status: 0,
							message: "error updating location",
							error: err
						});
						res.status(500).json({
							status: 0,
							message: "error updating location",
							error: 'problem with the server'
						});
					})
				}
			})
        }
	} else {
		console.error({
			status: 0,
			message: "UnAuthorized Access",
			error: 'user not have access to create or update locations'
		});
		res.status(401).json({
			status: 0,
			message: "UnAuthorized Access",
			error: 'you do not have access to create or update locations'
		});
    }
};

exports.removeStockLocation = (req, res) => {
	let locationId = req.params.locationId;
	if (req.accessType === "superadmin" || req.accessType === "admin" || req.accessType === "staffs") {
		if (locationId) {
			stockLocationModel.findOneAndRemove({ _id: locationId }, (err, result) => {
				if(err){
					console.error({
						status: 0,
						message: "error removing location",
						error: err
					});
					res.status(500).json({
						status: 0,
						message: "error removing location",
						error: 'problem with the server'
					});
				}else {
					res.status(201).json({
						status: 1,
						message: "stock location removed successfully"
					});
				}
			})
		} else if (!locationId) {
			console.error({
				status: 0,
				message: "Invalid Parameters",
				error: 'Invalid Parameters'
			});
			res.status(400).json({
				status: 0,
				message: "Invalid Parameters",
				error: 'Invalid Parameters'
			});
		}
	} else {
		console.error({
			status: 0,
			message: "UnAuthorized Access",
			error: 'user not have access to create or update locations'
		});
		res.status(401).json({
			status: 0,
			message: "UnAuthorized Access",
			error: 'you do not have access to create or update locations'
		});
	}
};