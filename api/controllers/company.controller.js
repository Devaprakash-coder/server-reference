'use strict';
/**
 * Dependency Modules
 */
const CompanyDetail = require('../models/company.model');
const Branches = require('./../models/branch.model');
const User = require('../models/auth.model');
const Member = require("../models/managementModels/member_directory.model");
const MailController = require('../controllers/common/mail.controller');
const config = require('../../config/config');   //NOTE: Use it for development
const base_url = config.development.base_url;   //NOTE: Use it for development
const Templates = require('../templates/mail.templates');
const fs = require('fs');
const sharp = require('sharp');

/**
 * Company API
 */

 
/**
 * Get company list 
 */
exports.get_companies_list = (req, res) => {
	CompanyDetail.find({}, 
		{ _id: 1, name: 1, email: 1, website: 1, phone: 1,  address: 1 }, 
		(err, company) => {
		if (err) {
			console.error({
				status: 0,
				message: "Problem getting companies list",
				error: err
			});

			res.status(500).json({
				status: 0,
				message: "Problem getting companies list",
				error: "Problem with the server"
			});
		}

		res.status(200).json({
			status: 1,
			message: "Data obtained successfully",
			companies_list: company
		});
	});
}

/**
 * Get company details 
 * @requires companyId
 */
exports.get_company_details = (req, res) => {
	CompanyDetail.findById(req.companyId, function (err, company) {
		if (err) {
			console.error({
				status: 0,
				message: "Problem getting company details",
				error: err
			});

			res.status(500).json({
				status: 0,
				message: "Problem getting company details",
				error: "Problem with the server"
			});
		}

		res.status(200).json({
			status: 1,
			message: "Data obtained successfully",
			company_detail: company
		});
	});
}

/**
 * Add new Company
 */
exports.add_new_details = (req, res) => {

	//Check if the company's email is already exists
	User.findOne({ email: req.body.email }, (err, existingCompany) => {
		if(err) {
			console.error({
				status: 0,
				message: 'error adding company 1',
				error: err
			});
			res.status(500).json({
				status: 0,
				message: 'error adding company',
				error: 'problem with the server'
			});
		}else if(existingCompany) {
			console.error({
				status: 0,
				message: `error adding company, email ${req.body.email} already exists!`,
				error: err
			});
			res.status(200).json({
				status: 0,
				message: 'email already exists',
				error: 'existing email'
			});
		}else{
			let requested_company_details = req.body;
			requested_company_details.discount_reasons = [
				{
					"status" : "active",
					"reason" : "owner's friend",
					"percentage" : "0"
				},
				{
					"status" : "active",
					"reason" : "manager approved",
					"percentage" : "0"
				},
				{
					"status" : "active",
					"reason" : "quality concern",
					"percentage" : "0"
				},
				{
					"status" : "active",
					"reason" : "quantity concern",
					"percentage" : "0"
				},
				{
					"status" : "active",
					"reason" : "promotion",
					"percentage" : "0"
				}
			]
			let company_detail = new CompanyDetail(req.body);
			// Setting companies default discount reasons here
			company_detail.save((err, company) => {
				if (err) {
					console.error({
						status: 0,
						message: "Error Registering Company",
						error: "Invalid Paramter"
					});
		
					res.status(404).json({
						status: 0,
						message: "Error Registering Company",
						error: "Invalid Paramter"
					});
				} else {
					let userData = [];
					userData.company_id = company._id;
					userData.name = company.name;
					userData.email = company.email;
					userData.password = req.body.password;
					userData.user_type = "superadmin";
		
					let user = new User(userData);
					user.save((err, registeredUser) => {
						if (err) {
							console.error({
								status: 0,
								message: "Error occured while registering user",
								error: err
							})
							res.status(500).json({
								status: 0,
								message: "Error occured while registering user",
								error: err
							});
						} else {
							let pin = Math.floor(1000 + Math.random() * 9000);

							let MemberData = {};
							MemberData.company_id = company._id;
							MemberData.status = "active";
							MemberData.position = "owner";
							MemberData.pin = pin;
							MemberData.name = company.name;

							MailController.setPin({ email: company.email, username: registeredUser.name, pin: pin })
		
							let member = new Member(MemberData);
							member.save((err, registeredMember) => {
								if (err) {
									res.status(404).json({
										status: 0,
										message: "Error saving member",
										error: err
									});
									res.status(400).json({
										status: 0,
										message: "Error saving member",
										error: err
									});
								} else {
									res.status(201).json({
										status: 1,
										message: "Data Updated Successfully",
										company_id: registeredMember.company_id
									})
								}
							})
						}
					});
				}
			});
		}
	});
}

/**
 * Update the company details for the params passed
 */
exports.update_company_details = (req, res) => {
	CompanyDetail.findById(req.companyId, (err, company_detail) => {
		if (err) {
			console.error({
				status: 0,
				message: "Error getting company details",
				error: err
			});

			res.status(500).json({
				status: 0,
				message: "Error getting company details",
				error: "Problem with the Servers"
			})
		}

		company_detail.set(req.body);
		//TODO need to restrict the returning data
		company_detail.save((err, updatedDetails) => {
			if (err) {
				console.error({
					status: 0,
					message: "Error Inserting Company detail",
					error: err
				})

				res.status(500).json({
					status: 0,
					message: "Error Inserting Company detail",
					error: "Problem with the Server"
				})
			}
			// res.json(updatedDetails);            //SelfNote: Old code sending whole details
			res.status(201).json({
				status: 1,
				message: 'Company details updated Successfully',
				company_detail: updatedDetails
			});
		});
	})
}

/**
 * Delete company (shell)
 */
exports.delete_company_details = (req, res) => {
}

/**
 * Get Company List (Shell)
 */
exports.get_all_company_details = (req, res) => {
}

/**
 * Company detail
 * (Add & Update) 
 * @requires discount_reason_id
 * @since no discount_reason_id add it as new
 */
exports.update_discount_reason = (req, res) => {
	CompanyDetail.findById(req.companyId, (err, company_detail) => {
		if (err) {
			console.error({
				status: 0,
				message: "Error saving member",
				error: err
			})

			res.status(400).json({
				status: 0,
				message: "Error saving member",
				error: "Problem with the Server"
			});
		}
		let updateData = req.body.discount_reasons;
		if (!updateData._id) {
			CompanyDetail.update({ '_id': req.companyId }, {
				"$push": { "discount_reasons": updateData }
			}, { "new": true, "upsert": true },
				function (err, result) {
					if (err) {
						console.error({
							status: 0,
							message: 'Error inserting new',
							error: err
						});
						res.status(500).json({
							status: 0,
							message: 'Error inserting new',
							error: "Problem with the Server"
						});
					}
					res.status(201).json({
						status: 1,
						message: "Discount reason Added Successfully",
						company_detail: result
					})
				});
		} else if (updateData._id) {
			CompanyDetail.update({ 'discount_reasons._id': updateData._id }, {
				'$set': {
					'discount_reasons.$': updateData
				}
			},
				function (err, result) {
					if (err) {
						console.error({
							status: 0,
							message: "Error updating Discount Reason",
							error: err
						});

						res.status(500).json({
							status: 0,
							message: "Error updating Discount Reason",
							error: "Problem with the Server"
						})
					}
					res.status(201).json({
						status: 1,
						message: "Discount reason updated successfully",
						company_detail: result
					})
				});
		}
	})
}

/**
 * Company API (Discount Reason) (Remove);
 * @requires discountId
 */
exports.remove_discount_reason = (req, res) => {
	let updateData = req.body.discount_reasons;

	if (updateData.id) {
		CompanyDetail.findById(req.companyId, (err, company_detail) => {
			if (err) {
				console.error({
					status: 0,
					message: "Error finding company details",
					error: err
				});

				res.status(500).json({
					status: 0,
					message: "Error finding company details",
					error: "Problem with the server"
				})
			}

			/**
			 * NOTE (self) : Remove 2 query and make it one (findByIdAndUpdate)
			 */

			CompanyDetail.update({ 'discount_reasons._id': updateData._id }, {
				'$set': {
					'discount_reasons.$.status': updateData.status,
				}
			}, (err, result) => {
				if (err) {
					console.error({
						status: 0,
						message: 'error updating discount reason',
						error: err
					});
					res.status(500).json({
						status: 0,
						message: "Error removing Discount Reason",
						error: "Problem with the server"
					})
				}
				res.status(201).json({
					status: 1,
					message: 'Data removed successfully',
					company_detail: result
				})
			});

		})
	} else {
		res.status(400).json({
			status: 0,
			message: 'Discount reason you are looking not found',
			error: "Invalid Paramter"
		});
	}
}

/**
 * Company API (Update) (Discount Reason)
 */
exports.update_stock_movement = (req, res) => {
	let updateData = req.body.stock_movement;
	if (!updateData._id) {
		CompanyDetail.update({ '_id': req.companyId }, {
			"$push": { 'stock_movement_reasons': updateData }
		}, { "new": true, "upsert": true },
			function (err, result) {
				if (err) {
					console.error({
						status: 0,
						message: 'Error inserting new stock movement',
						error: err
					});

					res.status(500).json({
						status: 0,
						message: 'Error inserting new stock movement',
						error: "Problem with the server"
					});
				}
				res.status(201).json({
					status: 1,
					message: "Stock Movement Added Successfully",
					company_detail: result
				});
			});
	} else if (updateData._id) {
		CompanyDetail.update({ 'stock_movement_reasons._id': updateData._id }, {
			'$set': { 'stock_movement_reasons.$': updateData },
		}, function (err, result) {
			if (err) {
				console.error({
					status: 0,
					message: "Error updating stock movement",
					error: err
				})

				res.status(201).json({
					status: 0,
					message: "Error updating stock movement",
					error: "Problem with the Server"
				});
			}
			res.status(201).json({
				status: 1,
				message: "Discount Reason updated successfully",
				company_detail: result
			});
		})
	}
}

/**
 * Company API (Remove) (Stock Movement);
 * @requires stackId
 */
exports.remove_stock_movement = (req, res) => {
	let updateData = req.body.stock_movement;
	if (updateData._id) {
		CompanyDetail.update({ 'stock_movement_reasons._id': updateData._id }, {
			'$set': { 'stock_movement_reasons.$.status': updateData.status }
		}, function (err, result) {
			if (err) {
				console.error({
					status: 0,
					message: "error removing stock movement",
					error: err
				});
				res.status(500).json({
					status: 0,
					message: "Error removing stock movement",
					error: 'Problem with the Server'
				});
			}
			res.status(201).json({
				status: 1,
				message: "Data Removed Successfully",
				company_detail: result
			});
		});
	} else if (!updateData._id) {
		res.status(400).json({
			status: 0,
			message: 'Stock movement reason you are looking is not found',
			error: 'No Data Found'
		});
	}
}


exports.updateBanner = (req, res) => {
	let bannerdetails = req.body;
	let imgdata = req.body.imageData.image;
	var filename = Math.floor(Math.random() * Math.floor(999999));
	var filetype = "";
	if (!fs.existsSync('uploads/banners/')){
		fs.mkdirSync('uploads/banners/');
	}
	if (imgdata.indexOf('png;base64') > -1) {
		var base64Data = imgdata.replace(/^data:image\/png;base64,/, "");
		filetype = ".png";
		var newpath = 'uploads/banners/' + filename + filetype;
	} else {
		filetype = ".jpeg";
		var base64Data = imgdata.replace(/^data:image\/jpeg;base64,/, "");
		var newpath = 'uploads/banners/' + filename + filetype;
	}

	fs.writeFile(newpath, base64Data, 'base64', function (err) {
		if (err) {
			res.status(500).json({
				status: 0,
				message: 'error uploading image'
			})
		}else {
			/**
			 * Note: This multi image resizing is used to improve performance on the app
			 */
			let small_image_dir = 'uploads/banners/small/';
			let medium_image_dir = 'uploads/banners/medium/';

			if (!fs.existsSync(small_image_dir)) {
				fs.mkdirSync(small_image_dir, { recursive: true })
			}
			if (!fs.existsSync(medium_image_dir)) {
				fs.mkdirSync(medium_image_dir, { recursive: true })
			}
			
			sharp(newpath).resize(150,100).jpeg({quality : 50}).toFile(`${small_image_dir}${filename}${filetype}`); 
			sharp(newpath).resize(300,200).jpeg({quality : 80}).toFile(`${medium_image_dir}${filename}${filetype}`); 

			if(bannerdetails._id) {
				Branches.findOne({_id: bannerdetails.branch_id },(err, branch) => {
					if(err) {
						res.status(500).send({
							status:0,
							message: 'problem with the server',
							error: 'internal server error'
						})
					}else if(!branch) {
						res.status(404).send({
							status:0,
							message: 'no branch found',
							error: 'invalid paramters'
						})
					} else {
						if(branch.banner_images.length){
							branch.banner_images.forEach(banner => {
								if(banner._id == bannerdetails._id) {
									banner.img_url = newpath
								}
							});

							branch.save((err, updatedBanners) => {
								if (err) return err;
								res.send(updatedBanners);
							});
						} else {
							branch.banner_images[0] = { img_url: newpath};
							branch.save((err, updatedBanners) => {
								if (err) return err;
								res.send(updatedBanners);
							});
						}
					}
				})
			}else{
				Branches.findOne({_id: bannerdetails.branch_id },(err, branch) => {
					if(err) {
						res.status(500).send({
							status:0,
							message: 'problem with the server',
							error: 'internal server error'
						})
					}else if(!branch) {					
						res.status(404).send({
							status:0,
							message: 'no branch found',
							error: 'invalid paramters'
						})
					} else {
						if(branch.banner_images.length){
							branch.banner_images.push({ img_url: newpath });
							
							branch.save((err, updatedBanners) => {
								if (err) return err;
								res.send(updatedBanners);
							});
						}else {
							branch.banner_images[0] = { img_url: newpath };
							branch.save((err, updatedBanners) => {
								if (err) return err;
								res.send(updatedBanners);
							});
						}
					}
				})
			}
		}
	});
}

exports.removeBanner = async (req, res) => {
	let bannerdetails = req.body;
	try {
		let branch = await Branches.findOne({ _id:bannerdetails.branch_id });
		let selectedImage = await branch.banner_images.find((x) => x._id == bannerdetails._id);

		let banner_images = await branch.banner_images.filter((image) => image._id != bannerdetails._id);

		branch.banner_images = banner_images;
		branch.save().then(() =>{
			let file_name = selectedImage.img_url.split("/")[2];
			fs.unlinkSync('uploads/banners/'+ file_name);
			fs.unlinkSync('uploads/banners/small/'+ file_name);
			fs.unlinkSync('uploads/banners/medium/'+ file_name);

			res.status(201).send({
				status: 1,
				message: 'image removed successfully'
			})
		})
	} catch {
		res.status(400).send({
			status: 0,
			message: 'error removing image',
			error: 'problem with the server'
		})
	}
}

