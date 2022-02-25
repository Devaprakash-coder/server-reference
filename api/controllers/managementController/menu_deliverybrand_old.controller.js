"use strict";
const DeliveryBrand = require("../../models/managementModels/delivery_brand.model");

exports.updateDeliveryBrand = (req, res) => {
	let brand_details = req.body.brand_details;
	if (req.accessType === "superadmin" || req.accessType === "admin" || req.accessType === "staffs") {
		//Tips: Improve this with async/ await if have time
		DeliveryBrand.aggregate([{ 
				$match:  { 
					branch_id: brand_details.branch_id
				}
			}], async (err, deliverybrands) => {
				if (err) {
					console.error({
						status: 0,
						message: "Error getting deliverybrands",
						error: err
					});
					res.status(500).json({
						status: 0,
						message: "Error getting Brand",
						error: "Problem with the server"
					});
				} else {
					let existingBrandsOfCategory = deliverybrands;
					let active_brands = existingBrandsOfCategory.filter((brand) => {
						if(brand.active == true) {
							return brand;
						}
					});


					if (!brand_details._id) {
						let brandData = [];
						brandData.company_id = req.companyId;
						brandData.branch_id = brand_details.branch_id;
                        brandData.name = brand_details.name;
						brandData.city = brand_details.city;
						brandData.address = brand_details.address;
						brandData.zip_codes = brand_details.zip_codes;
						brandData.geo_longitude = brand_details.geo_longitude;
						brandData.geo_latitude = brand_details.geo_latitude || "";
						brandData.min_pickup_time = brand_details.min_pickup_time || "";
						brandData.min_order_value = brand_details.min_order_value;
						brandData.min_delivery_time = brand_details.min_delivery_time;
						brandData.contact_phone = brand_details.contact_phone;
						brandData.notification_phones = brand_details.notification_phones;
						brandData.notification_emails = brand_details.notification_emails;
						brandData.ordering_enabled = brand_details.ordering_enabled;
						brandData.included_platforms = brand_details.included_platforms;
						brandData.platform_data = brand_details.platform_data;
						brandData.active = brand_details.active;
	
						let brand = new DeliveryBrand(brandData);

						brand.save(async(err, savedBrand) => {
							if (err) {
								console.error({
									status: 0,
									message: "Error saving brand!",
									error: err
								});
								res.status(500).json({
									status: 0,
									message: "Error saving brand! Please try later",
									error: "Problem with server"
								});
								
							} else {

												res.status(201).json({
													status: 1,
													message: "Brand Added successfully",
													brand: savedBrand
												});
											
							}
						});
					} else {
						DeliveryBrand.findById(brand_details._id, async (err, old_brand_detail) => {
							if (err) {
								console.error({
									status: 0,
									message: "Error finding brand",
									error: err
								});
								res.status(500).json({
									status: 0,
									message: "Error finding brand for the passed parameter",
									error: "Problem with server"
								});
							} else{
							
								old_brand_detail.set(brand_details);

								/**
								 *  TODO need to restrict the returning data
								 * Try to handle it from the front end
								 * */
								old_brand_detail.save(async (err, updatedBrand) => {
									if (err) {
										console.error({
											status: 0,
											message: "Error Updating brand",
											error: err
										});
										res.status(500).json({
											status: 0,
											message: "Error updating brand",
											error: "Problem with server"
										});
									}else{
										res.status(201).json({
											status: 1,
											message: "Brand Updated successfully",
											brand: updatedBrand
										});
									}
								});
							}
						});
					}
				}
			})

	}else {
		console.error({
			status: 0,
			message: "UnAuthorized Access",
			error: 'user not have access to create or update brands'
		});
		res.status(401).send({
			status: 0,
			message: "UnAuthorized Access",
			error: 'you do not have access to create or update brands'
		});
	}
};

exports.getAllDeliveryBrands = (req, res) => {
    let query_value = "";
	if (req.accessType === "superadmin" || req.accessType === "admin" || req.accessType === "staffs") {
		query_value = req.params.branchId;
	} else {
		res.status(401).send({ message: "Unauthorized Access" });
	}

	DeliveryBrand.find({ branch_id: query_value },
		(err, brand_list) => {
			if (err) {
				console.error({
					status: 0,
					message: "Error finding Brand on that branch",
					error: err
				});
				res.status(500).json({
					status: 0,
					message: "Error finding Brand on that particular branch",
					error: "Problem with server"
				});
			}
			if (!brand_list.length) {
				res.status(200).json({
					status: 0,
					message: "No brands found on a particular branch",
					error: "No brands asscoiated with the passed branch parameter"
				});
			} else {
				res.status(200).json({
					status: 1,
					message: "Data Obtained Successfully",
					brand_list: brand_list
				});
			}
		}
	)
};

exports.getDeliveryBrand = (req, res) => {
	DeliveryBrand.findOne({ _id: req.params.brandId },
		(err, brand_detail) => {
			if (err) {
				console.error({
					status: 0,
					message: "Error finding Brand",
					error: err
				});
				res.status(500).json({
					status: 0,
					message: "Error finding particular brand",
					error: "Problem with server"
				});
			}else if(!brand_detail) {
				res.status(200).json({
					status: 0,
					message: "No brand found for a particular id",
					error: "No brand asscoiated with the passed brand id"
				});
			} else {
				res.status(200).json({
					status: 1,
					message: "Data Obtained Successfully",
					data: brand_detail
				});
			}
		}
	)
};


exports.removeDeliverBrand = async (req, res) => {
	let brand_details = req.body.brand_details;

	DeliveryBrand.findById(brand_details._id, (err, brand_detail) => {
		if (err) {
			console.error({
				status: 0,
				message: "Error removing brand!",
				error: err
			});
			res.status(500).json({
				status: 0,
				message: "Error removing brand! Please try later",
				error: "Problem with server"
			});
		}else{
			// brand_detail.set({ brand_status: brand_details["brand_status"] });
			//TODO need to restrict the returning data
			if(brand_details.brand_status && brand_details.brand_status !== 'removed') {
				brand_detail.brand_status = brand_details.brand_status;
				brand_detail.save().then((result) => {
					res.status(201).json({
						status: 1,
						message: "Brand Removed Successfully",
					});
				}).catch((err) => {
					console.error({
						status: 0,
						message: "Error removing brand!",
						error: err
					});
					res.status(500).json({
						status: 0,
						message: "Error removing brand! Please try later",
						error: "Please check the parameters"
					});
				})
			} else{
                res.status(200).json({
                    status: 0,
                    message: "Error removing brand! Please try later",
                    error: "Brand Already Removed Status or not found"
                });
			
			}
		}
	});
};
