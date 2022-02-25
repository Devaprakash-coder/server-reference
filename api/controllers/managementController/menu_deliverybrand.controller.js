"use strict";
const request = require('request');
const DeliveryBrand = require("../../models/managementModels/delivery_brand.model");
const Urbanpiperresponse = require('../../models/omsModels/urbanpiper.model');
const mongoose = require('mongoose');
exports.getAllDeliveryBrands = (req, res) => {
	console.log(req.query.branch_id);
	if (req.accessType === "superadmin" || req.accessType === "admin" || req.accessType === "staffs") {
		DeliveryBrand.find({ branch_id: req.query.branch_id }, (err, brand_list) => {
			if (err) {
				console.error({ status: 0, message: "Error finding Brand on that branch", error: err });
				res.status(500).json({ status: 0, message: "Error finding Brand on that particular branch", error: "Problem with server" });
			}
		
			else if (!brand_list.length) {
				res.status(200).json({ status: 0, message: "No brands found on a particular branch", error: "No brands asscoiated with the passed branch parameter" });
			}
			else {
				res.status(200).json({ status: 1, message: "Data Obtained Successfully", list: brand_list });
			}
		});
	}
	else {
		res.status(401).send({ message: "Unauthorized Access" });
	}
};

exports.getDeliveryBrand = (req, res) => {
	DeliveryBrand.findOne({ _id: req.params.brandId }, (err, brand_detail) => {
		if (err) {
			console.error({ status: 0, message: "Error finding Brand", error: err });
			res.status(500).json({ status: 0, message: "Error finding particular brand", error: "Problem with server" });
		}
		else if (!brand_detail) {
			res.status(200).json({ status: 0, message: "No brand found for a particular id", error: "No brand asscoiated with the passed brand id" });
		}
		else {
			res.status(200).json({ status: 1, message: "Data Obtained Successfully", data: brand_detail });
		}
	});
};

exports.updateDeliveryBrand = (req, res) => {
	if (req.accessType === "superadmin" || req.accessType === "admin" || req.accessType === "staffs") {
		if (!req.body._id) {
			// add
			DeliveryBrand.create(req.body,async  function  (err, response) {
				if (!err && response) {
					let zipcodes = [];
					let notification_emails = [];
					let notification_phones = [];
					if(response.zip_codes.length >0){
					response.zip_codes.forEach(zip => {
						zipcodes.push(zip.value);
					});
				}
				if(response.notification_emails.length >0){
					response.notification_emails.forEach(zip => {
						notification_emails.push(zip.email);
					});
				}
					if(response.notification_phones.length >0){
					response.notification_phones.forEach(zip => {
						notification_phones.push(zip.number);
					});
				}
					let stores ={"stores":[ {
						"active": response.active,
						"address":  response.address,
						"city":  response.city,
						"contact_phone":  response.contact_phone,
						"excluded_platforms":  response.excluded_platforms,
						"included_platforms":  response.included_platforms,
						"geo_latitude":  response.geo_latitude,
						"geo_longitude":  response.geo_longitude,
						"hide_from_ui":  response.hide_from_ui,
						"min_delivery_time":  response.min_delivery_time,
						"min_order_value":  response.min_order_value,
						"min_pickup_time":  response.min_pickup_time,
						"name":  response.name,
						"notification_emails":  notification_emails,
						"notification_phones": notification_phones,
						"ordering_enabled":  response.ordering_enabled,
						"platform_data":  response.platform_data,
						"ref_id":  response.branch_id+"+"+response.name.replace(/\s/g, '-'),
						"timings":  response.timings,
						"zip_codes":  zipcodes
					  }]};
					const request = require('request');
					await request({ url: 'https://pos-int.urbanpiper.com/external/api/v1/stores/',headers: {'Content-Type': 'application/json','Authorization': 'apikey biz_adm_clients_zSKoOhaHdVkn:36dd26120ee18ba935bc40f1ab1d1dfda4930aba'}, method: 'POST', json : stores}, callback);
					function callback(error, response, body) {

						if (!error && response.statusCode == 200) {
							
							let urbanpiperrequest = new Urbanpiperresponse();
							urbanpiperrequest.request = body;
							urbanpiperrequest.response = null;
							urbanpiperrequest.request_type = "Add/update Store action";
							urbanpiperrequest.branch_id = response.branch_id;
							urbanpiperrequest.brand_id = response._id;
							urbanpiperrequest.save();
	
						}
					}
					res.status(201).json({ status: 1, message: "Brand Added successfully", brand: response });
				}
				else {
					console.error({ status: 0, message: "Error saving brand!", error: err });
					res.status(500).json({ status: 0, message: "Error saving brand! Please try later", error: "Problem with server" });
				}
			});
		}
		else {
			// update
			DeliveryBrand.findByIdAndUpdate(req.body._id, { $set: req.body }, async function(err, response) {
				if(!err && response) {
					let zipcodes = [];
					let notification_emails = [];
					let notification_phones = [];
					if(response.zip_codes.length >0){
					response.zip_codes.forEach(zip => {
						zipcodes.push(zip.value);
					});
				}
				if(response.notification_emails.length >0){
					response.notification_emails.forEach(zip => {
						notification_emails.push(zip.email);
					});
				}
					if(response.notification_phones.length >0){
					response.notification_phones.forEach(zip => {
						notification_phones.push(zip.number);
					});
				}
					let stores ={"stores":[ {
						"active": response.active,
						"address":  response.address,
						"city":  response.city,
						"contact_phone":  response.contact_phone,
						"excluded_platforms":  response.excluded_platforms,
						"included_platforms":  response.included_platforms,
						"geo_latitude":  response.geo_latitude,
						"geo_longitude":  response.geo_longitude,
						"hide_from_ui":  response.hide_from_ui,
						"min_delivery_time":  response.min_delivery_time,
						"min_order_value":  response.min_order_value,
						"min_pickup_time":  response.min_pickup_time,
						"name":  response.name,
						"notification_emails":  notification_emails,
						"notification_phones": notification_phones,
						"ordering_enabled":  response.active,
						"platform_data":  response.platform_data,
						"ref_id":  response.branch_id+"+"+response.name.replace(/\s/g, '-'),
						"timings":  response.timings,
						"zip_codes":  zipcodes
					  }]};
					  console.log(stores);
					const request = require('request');
					await request({ url: 'https://pos-int.urbanpiper.com/external/api/v1/stores/',headers: {'Content-Type': 'application/json','Authorization': 'apikey biz_adm_clients_zSKoOhaHdVkn:36dd26120ee18ba935bc40f1ab1d1dfda4930aba'}, method: 'POST', json: stores}, callback);
					function callback(error, response, body) {
						if (!error && response.statusCode == 200) {
							
							let urbanpiperrequest = new Urbanpiperresponse();
							urbanpiperrequest.request = body;
							urbanpiperrequest.response = null;
							urbanpiperrequest.branch_id = response.branch_id;
							urbanpiperrequest.brand_id = response._id;
							urbanpiperrequest.request_type = "Add/update Store action";
							urbanpiperrequest.save();
							res.status(201).json({ status: 1, message: "Brand Updated successfully", brand: response });
						}
					}
					
					//console.log(newNames);
					
				}
				else {
					console.error({ status: 0, message: "Error Updating brand", error: err });
					res.status(500).json({ status: 0, message: "Error updating brand", error: "Problem with server" });
				}
			});
		}
	}
	else {
		console.error({ status: 0, message: "UnAuthorized Access", error: 'user not have access to create or update brands' });
		res.status(401).send({ status: 0, message: "UnAuthorized Access", error: 'you do not have access to create or update brands' });
	}
};

exports.removeDeliverBrand = async (req, res) => {
	let branddetails = req.body;
	let status = false;
	let brandid = branddetails._id;
	if(branddetails.active === false){
		status = true;
	}else{
		status = false;
	}
	if (req.accessType === "superadmin" || req.accessType === "admin" || req.accessType === "staffs") {
		DeliveryBrand.findByIdAndUpdate(brandid, { $set: { active:status } },{new:true}, function(err, resp) {
			if(!err && resp) {

				  request({ url: 'http://localhost:5000/management/deliverybrands/',headers: {'Content-Type': 'application/json','Authorization': req.headers.authorization}, method: 'PUT',json:resp},(err,response,body) =>{
					  if(!err && response.statusCode == 201){
						res.status(201).json({ status: 1, message: "Brand Removed Successfully" });
					  }
										
				  });
			

			}
			else {
				console.error({ status: 0, message: "Error removing brand!", error: err });
				res.status(500).json({ status: 0, message: "Error removing brand! Please try later", error: "Problem with server" });
			}
		});
	}
	else {
		res.status(401).send({ message: "Unauthorized Access" });
	}
};
