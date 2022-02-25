'use strict';
const fs = require('fs');
const sharp = require('sharp');
const Categories = require('../../models/managementModels/menu_category.model');
const Company = require('../../models/company.model');
const Member = require('../../models/managementModels/member_directory.model');
const Branches =  require('../../models/branch.model');
const DeliveryBrand = require("../../models/managementModels/delivery_brand.model");
const mongoose = require('mongoose');
//TODO: Make it return categories of a company
// exports.getAllCategories = (req, res) => {
// 	Categories.findOne({ branch_id: req.branchId1 }, (err, categories) => {
// 		if (err) {
// 			throw err
// 		} else {
// 			res.json(categories);
// 		}
// 	})
// };

//NOTE: This will return categories of a particular branch
//TODO: Rename it to get branchCategory
exports.getBrachCategories = (req, res) => {
	let query_value;
	if (req.accessType === "superadmin" || req.accessType === "admin" || req.accessType === 'staffs') {
		query_value = req.params.branchId;
		getCategories();
	} else {
		res.status(401).send({ 'message': 'Unautorized Access' });
	}

	function getCategories() {
		Categories.aggregate([
			{ $match: { branch_id: query_value } 
			},
			{
				$project: {
					categories: {
						$filter: {
							input: "$categories",
							as: "category",
							// cond: { $eq: ["$$category.status", 'active'] }
							cond: { 
								$or: [ 
									{ $eq: [ "$$category.status", 'active' ] },
									{ $eq: [ "$$category.status", 'inactive' ] }
								] 
							}
						}
					},
					_id: 1,
					branch_id: 1
				}
			},
			{ $unwind: "$categories" },
			{ $sort: { "categories.rank": 1 } },
			{ $group: { _id: "$_id", categories: { $push: "$categories" }, branch_id: { $first: "$branch_id" } } }
		], async (err, categories) => {
			if (err) {
				// throw err
				console.error({
					status: 0,
					message: 'error finding categories',
					error: err
				})
				res.status(500).json({
					status: 0,
					message: 'error finding categories',
					error: 'problem with the server'
				});
			} else {
				if(categories.length) {
					let temp_array = [];
					await asyncForEach(categories, async (list) => {
						let filterdCategory = list.categories.filter((category) => (category.status == 'active' || category.status == 'inactive'))
						await asyncForEach(filterdCategory, async (category) => {
							category.branch_id = list.branch_id;
						});
						temp_array.push(list.categories);
					});

					async function asyncForEach(array, callback) {
						for (let index = 0; index < array.length; index++) {
							await callback(array[index], index, array);
						}
					}

					const flatten = arr => arr.reduce((acc, next) => acc.concat(Array.isArray(next) ? flatten(next) : next), [])
					let updated_category_list =  categories[0];
					updated_category_list.categories = await flatten(temp_array);
					res.status(200).json(updated_category_list);
				}else{
					res.status(200).json([])
				}
				
			}
		})
	}

};

exports.getBrachCategories_bkp = (req, res) => {
	let query_value;
	if (req.accessType === "superadmin" || req.accessType === "admin" || req.accessType === 'staffs') {
		query_value = req.params.branchId;
		getCategories();
	} else {
		res.status(401).send({ 'message': 'Unautorized Access' });
	}

	function getCategories() {
		Categories.aggregate([
			{ $match: { branch_id: query_value } },
			{
				$project: {
					categories: {
						$filter: {
							input: "$categories",
							as: "category",
							cond: { $eq: ["$$category.status", 'active'] }
						}
					},
					_id: 1,
					branch_id: 1
				}
			},
			{ $unwind: "$categories" },
			{ $sort: { "categories.rank": 1 } },
			{ $group: { _id: "$_id", categories: { $push: "$categories" }, branch_id: { $first: "$branch_id" } } }
		], (err, categories) => {
			if (err) {
				// throw err
				res.status(500).json({
					status: 0,
					message: 'error finding categories',
					error: 'problem with the server'
				});
			} else {
				res.status(200).json(categories[0]);
			}
		})
	}

};

exports.getCategory = (req, res) => {
	//TODO need to return a particualr category (use $elementMatch)
	Categories.findOne({ 'categories._id': req.params.categoryId }, function (err, category) {
		if (err) {
			res.status(400).send(err);
		} else {
			res.status(200).json(category);
		}
	});
};

/**
 * Depricated
 */
exports.addCategory = (req, res) => {
	let addData = req.body.category_data;

	let categoryData = [];
	categoryData.company_id = req.companyId;
	if (req.accessType === "superadmin" || req.accessType === "admin" || req.accessType === "staffs") {
		categoryData.branch_id = addData.branch_id;
	} else {
		res.status(401).send({ 'message': 'UnAuthorized Access' })
	}
	categoryData.categories = req.body.categories;

	let category = new Categories(categoryData);
	category.save((err, savedCategory) => {
		if (err) {
			res.send({ message: "Error saving branch! Please try later" })
		} else {
			res.json(savedCategory);
		}
	})
};

exports.updateCategory = (req, res) => {
	let updateData = req.body.category_data;
	let query_value = '';
	if (req.accessType === "superadmin" || req.accessType === "admin" || req.accessType === "staffs") {
		query_value = updateData.branch_id;
		//Tips: Improve this with async/ await if have time
		let uploadImage = new Promise((resolve, reject) => {
			if (updateData.imageData && updateData.imageData.image) {
				let imgdata = updateData.imageData.image;

				var filename = Math.floor(Math.random() * Math.floor(999999));
				var filetype = "";
				if (imgdata.indexOf("png;base64") > -1) {
					var base64Data = imgdata.replace(/^data:image\/png;base64,/, "");
					filetype = ".png";
					var newpath = "uploads/categories/images/" + filename + filetype;
				} else {
					filetype = ".jpeg";
					var base64Data = imgdata.replace(/^data:image\/jpeg;base64,/, "");
					var newpath = "uploads/categories/images/" + filename + filetype;
				}
				fs.writeFile(newpath, base64Data, "base64", function (err) {
					if (err) {
						console.error({
							status: 0,
							message: "error uploading image",
							error: err
						});
						res.status(500).json({
							status: 0,
							message: "error uploading image",
							error: 'Problem with the server'
						});
					} else {
						updateData.imageUrl = newpath;
						/**
						 * Note: This multi image resizing is used to improve performance on the app
						 */
						let small_image_dir = 'uploads/categories/images/small/';
						let medium_image_dir = 'uploads/categories/images/medium/';
						let large_image_dir = 'uploads/categories/images/large/';

						if (!fs.existsSync(small_image_dir)) {
							fs.mkdirSync(small_image_dir, { recursive: true })
						}
						if (!fs.existsSync(medium_image_dir)) {
							fs.mkdirSync(medium_image_dir, { recursive: true })
						}
						if (!fs.existsSync(large_image_dir)) {
							fs.mkdirSync(large_image_dir, { recursive: true })
						}
						
						sharp(newpath).resize(100,100).jpeg({quality : 50}).toFile(`${small_image_dir}${filename}${filetype}`); 
						sharp(newpath).resize(200,200).jpeg({quality : 70}).toFile(`${medium_image_dir}${filename}${filetype}`); 
						sharp(newpath).resize(300,300).jpeg({quality : 80}).toFile(`${large_image_dir}${filename}${filetype}`); 

						resolve(updateData);
					}
				});
			} else {
				resolve(updateData);
			}
		});


		uploadImage.then((result) => {
			Categories.aggregate([
				{ $match: { branch_id: query_value } },
			], (err, categories) => {
				if (err) {
					console.error({
						status: 0,
						message: 'Error Finding category',
						error: err
					});
					res.status(500).json({
						status: 0,
						message: 'Error Finding category',
						error: 'Problem with the server'
					});
				} else {
					let existing_categories = categories[0].categories;
					let active_categories = existing_categories.filter((category) => {
						if (category.status === 'active') {
							return category;
						}
					});
					if (!updateData._id) {
						updateData.item_count = 0;

						if (updateData.rank < active_categories.length) {
							existing_categories.forEach((category) => {
								if (category.rank >= updateData.rank && category.status == 'active') {
									category.rank++;
								}
							});
							existing_categories.push(updateData);
						} else {
							updateData.rank = active_categories.length + 1;
							existing_categories.push(updateData);
						}
						
						Categories.findOneAndUpdate({ branch_id: query_value }, { "$set": { 'categories': existing_categories } }, { "new": true, "upsert": true },
							(err, result) => {
								if (err) {
									console.error({
										status: 0,
										message: 'Error Updating Category',
										error: err
									});
									res.status(500).json({
										status: 0,
										message: 'Error updating Category',
										error: 'Problem with the server'
									})
								}
								let lastcategory = result.categories.length - 1;
								let newcategory = result.categories[lastcategory];
								// let categories_data = {
								// 	category_id:newcategory._id,
								// 	status:newcategory.status
								// }
									newcategory.associated_brand_sections.forEach(element => {
									if(element.selected == true){
										DeliveryBrand.findOneAndUpdate({_id:element.brand_id},{$push:{'categories':newcategory._id}},
										{ "new": true, "upsert": true },(err, updatebrand) => {
											if(err){
												console.error({
													status: 0,
													message: 'Error Updating Brand category',
													error: err
												});
											}
										});
									}
								});
						
								if (existing_categories.length <= 2) {
									let filteredCategory = existing_categories.filter(category => {
										return (category.name.toLowerCase() === 'starters' || category.name.toLowerCase() === 'main course');
									});

									if (filteredCategory.length === existing_categories.length) {
										Member.update({ _id: req.userId }, { $set: { tour_status: 'category_details' } }, (err, updatedMember) => {
											if (err) {
												console.error({
													status: 0,
													message: 'Error Updating Member',
													error: err
												});
												res.status(500).json({
													status: 0,
													message: 'Error Updating Member',
													error: 'Problem with the server'
												});
											} else {
												res.status(201).json(result);
											}
										})
									} else {
										res.status(201).json(result);
									}
								} else {
									res.status(201).json(result);
								}
							
							});
					} else if (updateData._id) {
						let chosenCategoryIndex;
						let chosenCategory = existing_categories.filter((category, i) => {
							if (category._id == updateData._id) {
								chosenCategoryIndex = i;
								return category
							}
						})[0];

						if (updateData.rank < active_categories.length && updateData.rank > chosenCategory.rank) {
							//CONDITION: Incomin rank is less than the active cat length and imcoming rank 
							existing_categories.forEach((category) => {
								if ((category.rank <= updateData.rank) && (category.rank > chosenCategory.rank)) {
									category.rank--;
								}
							});
							existing_categories[chosenCategoryIndex].rank = updateData.rank;
						} else if (updateData.rank < active_categories.length && updateData.rank < chosenCategory.rank) {
							existing_categories.forEach((category) => {
								if ((category.rank >= updateData.rank) && (category.rank < chosenCategory.rank)) {
									category.rank++;
								}
							});
							existing_categories[chosenCategoryIndex].rank = updateData.rank;
						}else if (updateData.rank < active_categories.length && chosenCategory.rank === updateData.rank) {
							existing_categories[chosenCategoryIndex] = updateData;
						} else if (updateData.rank >= active_categories.length) {
							existing_categories.forEach((category) => {
								if ((category.rank > chosenCategory.rank)) {
									category.rank--;
								}
							});
							existing_categories[chosenCategoryIndex].rank = active_categories.length;
						}
						
						existing_categories[chosenCategoryIndex].name = updateData.name;
						existing_categories[chosenCategoryIndex].associated_dept_sections = updateData.associated_dept_sections;
						existing_categories[chosenCategoryIndex].associated_brand_sections = updateData.associated_brand_sections;
						if(updateData.imageUrl) {
							existing_categories[chosenCategoryIndex].imageUrl = updateData.imageUrl;
						}

						existing_categories[chosenCategoryIndex].item_count = chosenCategory.item_count ? chosenCategory.item_count : existing_categories[chosenCategoryIndex].item_count;

						Categories.findOneAndUpdate({ branch_id: query_value },
							{ "$set": { 'categories': existing_categories } },
							{ "new": true, "upsert": true },async (err, updatedCategory) => {
								if (err) {
									res.status(500).json({
										status: 0,
										message: 'Error Updating Category',
										error: 'problem with the server'
									})
								} else {
									let cat_id = updatedCategory.categories[chosenCategoryIndex]._id;

									if(updatedCategory.categories[chosenCategoryIndex].associated_brand_sections && updatedCategory.categories[chosenCategoryIndex].associated_brand_sections.length){
									await updatedCategory.categories[chosenCategoryIndex].associated_brand_sections.forEach(async element => {

										if(element.selected == true){
											
											await DeliveryBrand.findOneAndUpdate({_id:element.brand_id,categories :{'$nin':[cat_id]}},{$push:{'categories':cat_id}},{new:true},(err, updatebrand) => {
												if(err){
													console.error({
														status: 0,
														message: 'Error Pusshing Brand category',
														error: err
													});
												}

											});
										}else if(element.selected == false){
											
											await DeliveryBrand.findOneAndUpdate({_id:element.brand_id,categories :{'$in':[cat_id]}},{$pull:{'categories':cat_id}},(err, updatebrand) => {
												if(err){
													console.error({
														status: 0,
														message: 'Error Pulling Brand category',
														error: err
													});
												}

											});
										}

									});
								}
									res.status(201).json({
										status: 1,
										message: 'category updated successfully',
									})
								
							}
							}
						)
					}
				}
			})
		})
	} else {
		console.error({
			status: 0,
			message: "UnAuthorized Access",
			error: 'user not have access to create or update items'
		});
		res.status(401).send({
			status: 0,
			message: "UnAuthorized Access",
			error: 'you do not have access to create or update items'
		});
	}
};

exports.softRemove = (req, res) => {
	let updateData = req.body.category_data;
	if (req.accessType === "superadmin" || req.accessType === "admin" || req.accessType === "staffs") {
		if (updateData._id) {
			Categories.findOne({ 'categories._id': updateData._id }, (err, result) => {
				if (err) {
					console.error({
						status: 0,
						message: 'error removing category',
						error: err
					});
					res.status(500).json({
						status: 0,
						message: 'error removing category',
						error: 'problem with the server'
					});
				} else {
					let existing_categories = result.categories;
					let chosenCategoryIndex;
					let chosenCategory = existing_categories.filter((category, i) => {
						if (category._id == updateData._id) {
							chosenCategoryIndex = i;
							return category
						}
					})[0]

					existing_categories.forEach((category) => {
						if ((category.rank > chosenCategory.rank) && (category._id != chosenCategory._id)) {
							category.rank--;
						}
					});
					// existing_categories[chosenCategoryIndex].status = updateData.status; // old method now changed to hard remove
					existing_categories.splice(chosenCategoryIndex, 1)

					Categories.update({ branch_id: result.branch_id },
						{ "$set": { 'categories': existing_categories } },
						{ "new": true, "upsert": true },
						(err, removedResult) => {
							if (err) {
								console.error({
									status: 0,
									message: 'error removing category',
									error: err
								});
								res.status(500).json({
									status: 0,
									message: 'error removing category',
									error: 'problem with the server'
								});
							} else {
								res.status(201).json({
									status: 1,
									message: 'category removed successfully',
								});
							}
						})
				}
			});
		} else if (!updateData._id) {
			res.status(400).send('category is not found');
		}
	} else {
		res.status(401).send({ 'message': 'UnAuthorized Access' })
	}
};

exports.removeCategory = (req, res) => {
	//TODO: Hard delete
	// res.json({hello : 'world'})
};
