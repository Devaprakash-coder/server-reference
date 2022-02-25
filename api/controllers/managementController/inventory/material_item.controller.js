"use strict";
const fs = require('fs');
const sharp = require('sharp');
const materialItem = require('../../../models/managementModels/inventory/material_item.model');
const materialCategory = require('../../../models/managementModels/inventory/material_category.model');
const suppliermaterials = require('../../../models/managementModels/inventory/suppliers_materials.model');

/**
 * Get Items of a particular Category Type
 * @param categoryId
 * @param dayName ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday' ]
 */
exports.getMaterialCategoryItems = (req, res) => {
	let category_id = req.params.categoryId;
	/**
	 * Note : Check For dayName to filter out items 
	 * available on a  particular day
	 */
	if (category_id) {
		/**
		 * This methd will be depricated or restricted to admin 
		 * Now the old requests need to call the url with day at the end
		 */
		/**
		 * Note : Check For category id and it does not contains dayName param
		 */
		let query = { category_id: category_id, item_status: { $ne: 'removed' } };
		// let option = { "addons.status": 0, company_id: 0, category_name: 0, __v: 0 }

		// materialItem.find(query,

		materialItem.aggregate([
				{ $match: query },
				{ $addFields: { material_id: { $toString: "$_id" } } },
				{ $lookup: {
					from: 'material_stocks',
					localField: 'material_id',
					foreignField: 'material_id',
					as: 'new_list'
					} 
				},
				{ $unwind: {
						path: '$new_list',
      					preserveNullAndEmptyArrays: true
					}
				},
				{ $addFields: { stock_details: '$new_list.current_stocks' } }, 
				{ $project: {
					new_list: 0,
					__v: 0,
					applied_addons: 0,
					addons: 0,
					item_sold_count: 0,
					item_sold_in_month: 0,
					tags: 0
				}
				}
			],
			(err, item_list) => {
				if (err) {
					console.error({
						status: 0,
						message: "Error finding Items",
						error: err
					});
					res.status(500).json({
						status: 0,
						message: "Error finding Items of the passed category Id",
						error: "Problem with server"
					});
				} else if (!item_list.length) {
					res.status(200).json({
						status: 0,
						message: "No items found",
						error: "No items asscoiated with the passed category Id"
					});
				} else {
					res.status(200).json({
						status: 1,
						message: "Data Obtained Successfully",
						item_list: item_list
					});
				}
			});

	} else {
		res.status(400).json({
			status: 0,
			message: "Category ID Required",
			error: "Invalid parameter"
		});
	}
};

/**
 * Get all Items of a particular Branch
 * @param BranchId
 */
exports.getAllItemsOfBranch = (req, res) => {
	let query_value = "";
	if (req.accessType === "superadmin" || req.accessType === "admin" || req.accessType === "staffs") {
		query_value = req.params.branchId;
	} else {
		res.status(401).send({ message: "Unauthorized Access" });
	}

	materialItem.find({ branch_id: query_value, item_status: 'active' },
		(err, item_list) => {
			if (err) {
				console.error({
					status: 0,
					message: "Error finding Item on that branch",
					error: err
				});
				res.status(500).json({
					status: 0,
					message: "Error finding Item on that particular branch",
					error: "Problem with server"
				});
			}
			if (!item_list.length) {
				res.status(200).json({
					status: 0,
					message: "No items found on a particular branch",
					error: "No items asscoiated with the passed branch parameter"
				});
			} else {
				res.status(200).json({
					status: 1,
					message: "Data Obtained Successfully",
					item_list: item_list
				});
			}
		}
	)
};

/**
 * Add & Update Item
 * @argument _id
 * @description if the item we are updating contains _id, 
 * then it is considered as an existing item. Else it acts
 * as a new item and get saved
 */
exports.updateItem = (req, res) => {
	let item_details = req.body.item_details;

	if (req.accessType === "superadmin" || req.accessType === "admin" || req.accessType === "staffs") {
		//Tips: Improve this with async/ await if have time
		let uploadImage = new Promise((resolve, reject) => {
			if (item_details.imageData.image) {
				let imgdata = item_details.imageData.image;

				var filename = Math.floor(Math.random() * Math.floor(999999));
				var filetype = "";
				if (imgdata.indexOf("png;base64") > -1) {
					var base64Data = imgdata.replace(/^data:image\/png;base64,/, "");
					filetype = ".png";
					var newpath = "uploads/items/images/" + filename + filetype;
				} else {
					filetype = ".jpeg";
					var base64Data = imgdata.replace(/^data:image\/jpeg;base64,/, "");
					var newpath = "uploads/items/images/" + filename + filetype;
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
						item_details.imageUrl = newpath;
						/**
						 * Note: This multi image resizing is used to improve performance on the app
						 */
						let small_image_dir = 'uploads/items/images/small/';
						let medium_image_dir = 'uploads/items/images/medium/';
						let large_image_dir = 'uploads/items/images/large/';

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

						resolve(item_details);
					}
				});
			} else {
				resolve(item_details);
			}
		});

		uploadImage.then(result => {
			materialItem.aggregate([{
				$match: {
					branch_id: item_details.branch_id,
					category_id: item_details.category_id
				}
			}], async (err, categoryItems) => {
				if (err) {
					console.error({
						status: 0,
						message: "Error getting Item",
						error: err
					});
					res.status(500).json({
						status: 0,
						message: "Error getting Item",
						error: "Problem with the server"
					});
				} else {
					let existingItemsOfCategory = categoryItems;
					let active_items = existingItemsOfCategory.filter((item) => {
						if (item.item_status !== 'removed') {
							return item;
						}
					});

					let existingItemOfSameMaterialId = await active_items.filter((item) => {
						if ((item.material_code == item_details.material_code) && (item._id != item_details._id)) {
							return item;
						}
					});

					if (existingItemOfSameMaterialId.length) {
						console.error({
							status: 0,
							message: "Material Code already exists",
							error: err
						});
						res.status(404).json({
							status: 0,
							message: "Material Code already exists",
							error: "Invalid Paramters"
						});
					} else {
						if (!item_details._id) {
							//new material item
							let itemData = [];
							if (item_details.rank < active_items.length) {
								await materialItem.updateMany({ category_id: item_details.category_id, rank: { $gte: item_details.rank } }, { rank: { $inc: 1 } }, { "new": true, "upsert": true });
								itemData.rank = item_details.rank; //Used for ranking items
							} else {
								itemData.rank = active_items.length + 1; //Used for ranking items
							}

							itemData.company_id = req.companyId;
							itemData.branch_id = item_details.branch_id;
							itemData.category_id = item_details.category_id;
							itemData.category_name = item_details.category_name;
							itemData.name = item_details.name;
							itemData.imageUrl = item_details.imageUrl;
							itemData.tags = item_details.tags || "";
							itemData.material_code = item_details.material_code || "";
							itemData.min_stock = item_details.min_stock || "";
							itemData.shelf_life = item_details.shelf_life || "";
							itemData.unit = item_details.unit || "";
							itemData.short_unit = item_details.short_unit || "";
							itemData.applied_addons = item_details.applied_addons;
							itemData.type = item_details.type; //new on 31/dec/2020 by pravin
							itemData.addons = item_details.addons || [];

							let item = new materialItem(itemData);

							item.save((err, savedItem) => {
								if (err) {
									console.error({
										status: 0,
										message: "Error saving item!",
										error: err
									});
									res.status(500).json({
										status: 0,
										message: "Error saving item! Please try later",
										error: "Problem with server"
									});
									// res.send({ message: "Error saving item! Please try later" }); (Old code)
								} else {
									materialCategory.findOneAndUpdate(
										{ "categories._id": savedItem.category_id },
										{ $set: { "categories.$.item_count": active_items.length + 1 } },
										(err, updatedCategory) => {
											if (err) {
												console.error({
													status: 0,
													message: "Error updating category count!",
													error: err
												});
												res.status(500).json({
													status: 0,
													message: "Error saving item! Please try later",
													error: "Problem with server"
												});
											} else {
												res.status(201).json({
													status: 1,
													message: "Item Added successfully",
													item: savedItem
												});
											}
										}
									);
								}
							});
						} else {
							//existing material item
							materialItem.findById(item_details._id, async (err, old_item_detail) => {
								if (!old_item_detail.rank) {
									old_item_detail.rank = 0;
								}
								if (err) {
									console.error({
										status: 0,
										message: "Error finding item",
										error: err
									});
									res.status(500).json({
										status: 0,
										message: "Error finding item for the passed parameter",
										error: "Problem with server"
									});
								} else {
									if (item_details.rank > active_items.length) {
										await materialItem.updateMany(
											{ category_id: old_item_detail.category_id, rank: { $gt: old_item_detail.rank } },
											{ $inc: { rank: -1 } },
										)
										item_details.rank = active_items.length;
									} else if (old_item_detail.rank < item_details.rank) {
										await materialItem.updateMany(
											{ category_id: old_item_detail.category_id, rank: { $gt: old_item_detail.rank, $lte: item_details.rank } },
											{ $inc: { rank: -1 } },
										);
										old_item_detail.rank = item_details.rank;

									} else {
										await materialItem.updateMany(
											{ category_id: old_item_detail.category_id, rank: { $lt: old_item_detail.rank, $gte: item_details.rank } },
											{ $inc: { rank: 1 } },
										);
										old_item_detail.rank = item_details.rank;
									}
									old_item_detail.set(item_details);

									/**
									 *  TODO need to restrict the returning data
									 * Try to handle it from the front end
									 * */
									old_item_detail.save((err, updatedItem) => {
										if (err) {
											console.error({
												status: 0,
												message: "Error Updating item",
												error: err
											});
											res.status(500).json({
												status: 0,
												message: "Error updating item",
												error: "Problem with server"
											});
										} else {
											res.status(201).json({
												status: 1,
												message: "Item Added successfully",
												item: updatedItem
											});
											// res.send(updatedDetails);  (Old code)
										}
									});
								}
							});
						}
					}

				}
			})
		});
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

exports.softRemove = async (req, res) => {
	let item_details = req.body.item_details;
	let categoryItemCount = await materialItem.find({ category_id: item_details.category_id, item_status: { $ne: 'removed' } }).count();

	materialItem.findById(item_details._id, (err, item_detail) => {
		if (err) {
			console.error({
				status: 0,
				message: "Error removing item!",
				error: err
			});
			res.status(500).json({
				status: 0,
				message: "Error removing item! Please try later",
				error: "Problem with server"
			});
		} else {
			item_detail.set({ item_status: item_details["item_status"] });
			//TODO need to restrict the returning data
			item_detail.save(async (err, updatedDetails) => {
				if (err) {
					console.error({
						status: 0,
						message: "Error removing item!",
						error: err
					});
					res.status(500).json({
						status: 0,
						message: "Error removing item! Please try later",
						error: "Please check the parameters"
					});
				} else {
					await materialItem.updateMany(
						{
							category_id: item_details.category_id,
							rank: { $gt: item_detail.rank }
						},
						{ $inc: { rank: -1 } },
						// { "new": true, "upsert": true },
					)
					materialCategory.findOneAndUpdate(
						{ "categories._id": item_detail.category_id },
						{ $set: { "categories.$.item_count": (categoryItemCount - 1) } },
						(error, updatedResult) => {
							if (error) {
								console.error({
									status: 0,
									message: "Error updating category Count!",
									error: err
								});
								res.status(500).json({
									status: 0,
									message: "Problem removing item! Please try later",
									error: "Problem with the parameters"
								});
							} else {
								res.status(201).json({
									status: 1,
									message: "Item Removed Successfully",
								});
							}
						}
					);
				}
			});
		}
	});
};

/**
 * remove Item Hard delete
 * @argument _id
 * @description remove item permenantly, also removes the associated material 
 * from the supplier list
 */
exports.removeItem = async (req, res) => {
	materialItem.findOneAndRemove({ _id : req.params.itemId }, async (err, item_detail) => {
		if (err) {
			console.error({
				status: 0,
				message: "Error removing item!",
				error: err
			});
			res.status(500).json({
				status: 0,
				message: "Error removing item! Please try later",
				error: "Problem with server"
			});
		}else if(!item_detail){
			console.error({
				status: 0,
				message: "no material item found",
				error: err
			});
			res.status(404).json({
				status: 0,
				message: "no material item found",
				error: "please check the parameter"
			});
		} else {
			await suppliermaterials.update({ }, { $pull: { materials: { material_id: item_detail._id }} }, { multi: true})
			let categoryItemCount = await materialItem.find({ category_id: item_detail.category_id, item_status: { $ne: 'removed' } }).count();

			await materialCategory.findOneAndUpdate(
				{ "categories._id": item_detail.category_id },
				{ $set: { "categories.$.item_count": ( categoryItemCount - 1 ) } },
				(error, updatedResult) => {
					if (error) {
						console.error({
							status: 0,
							message: "Error updating category Count!",
							error: err
						});
						res.status(500).json({
							status: 0,
							message: "Problem removing item! Please try later",
							error: "Problem with the parameters"
						});
					} else {
						res.status(201).json({
							status: 1,
							message: "Item Removed Successfully",
						});
					}
				}
			);

		} 
	});
};