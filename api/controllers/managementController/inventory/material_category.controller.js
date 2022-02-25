'use strict';
const Member = require('../../../models/managementModels/member_directory.model');
const MaterialCategories = require("../../../models/managementModels/inventory/material_category.model");
const MaterialItems = require("../../../models/managementModels/inventory/material_item.model");

//NOTE: This will return categories of a particular branch
//TODO: Rename it to get branchCategory
exports.getBrachMaterialCategories = (req, res) => {
	let query_value;
	if (req.accessType === 'superadmin' || req.accessType === 'admin' || req.accessType === 'staffs') {
		query_value = req.params.branchId;
		getCategories();
	} else {
		res.status(401).send({ 'message': 'Unautorized Access' });
	}

	function getCategories() {
		MaterialCategories.aggregate([
			{ $match: { branch_id: query_value } },
			// { $group: { _id: '$category_id', name: { $first: "$category_name"}, item_list: { $push: { name: '$name'} }  } }
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
					branch_id: 1,
					name: 1
				}
			},
			// { $unwind: "$categories" },
			// { $sort: { "categories.rank": 1 } },
			// { $group: { _id: "$_id", categories: { $push: "$categories" }, branch_id: { $first: "$branch_id" }, item_list: { $push: { name: '$name'} } } }
		], async (err, categories) => {
			if (err) {
				// throw err
				res.status(500).json({
					status: 0,
					message: 'error finding categories',
					error: 'problem with the server'
				});
			} else {
				let temp_array = [];
				await asyncForEach(categories, async (list) => {
					let filterdCategory = list.categories.filter((category) => category.status == 'active')
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

				const flatten = arr => arr.reduce((acc, next) => acc.concat(Array.isArray(next) ? flatten(next) : next), []);

				let updated_category_list;
				if(categories.length) {
					updated_category_list =  categories[0];
					updated_category_list.categories = await flatten(temp_array);
				}else{
					updated_category_list = categories;
				}

				// if(updated_category_list.categories && updated_category_list.categories.length) {
				// 	let filtered_category = updated_category_list.categories.filter((category) => {
				// 		if(category.status === 'active') {
				// 			return category;
				// 		}
				// 	})
				// 	updated_category_list.categories = filtered_category;
				// 	res.status(200).json(updated_category_list);
				// }else{
					res.status(200).json(updated_category_list);
				// }

			}
		})
	}

};

exports.getMaterialCategory = (req, res) => {
	//TODO need to return a particualr category (use $elementMatch)
	MaterialCategories.findOne({ 'categories._id': req.params.categoryId }, function (err, category) {
		if (err) {
			res.status(400).send(err);
		} else {
			res.status(200).json(category);
		}
	});
};

exports.updateMaterialCategory = (req, res) => {
	let updateData = req.body.category_data;
	let query_value = '';
	let branchId;

	if (req.accessType === "superadmin" || req.accessType === "admin" || req.accessType === "staffs") {
		query_value = updateData.branch_id
		branchId = updateData.branch_id;

		MaterialCategories.aggregate([
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
			} else if(categories.length) {
				let existing_categories = categories[0].categories;
				let active_categories = existing_categories.filter((category) => {
					if (category.status === 'active') {
						return category;
					}
				});
				if (!updateData._id) {
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
					
					MaterialCategories.update({ branch_id: query_value }, { "$set": { 'categories': existing_categories } }, { "new": true, "upsert": true },
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

					MaterialCategories.update({ branch_id: query_value },
						{ "$set": { 'categories': existing_categories } },
						{ "new": true, "upsert": true },
						(err, updatedCategory) => {
							if (err) {
								res.status(500).json({
									status: 0,
									message: 'Error Updating Category',
									error: 'problem with the server'
								})
							} else {
								res.status(201).json({
									status: 1,
									message: 'category updated successfully',
								})
							}
						}
					)
				}
			} else{
				let branchCategory = {
					branch_id: branchId
					, categories: [
						{ name: updateData.name , status: updateData.status, rank: updateData.rank }
					]					
				};

				let newBranchMaterialCategory = new MaterialCategories(branchCategory);
				newBranchMaterialCategory.save().then((result) => {
					res.status(201).json(result)
				}).catch((err) => {
					console.error('err obtained successfully -----', err);
					res.status(500).json({
						status: 0,
						message: 'error updating category',
						error: 'problem with the server'
					})
				})
			}
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
			MaterialCategories.findOne({ 'categories._id': updateData._id }, (err, result) => {
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
					// existing_categories[chosenCategoryIndex].rank = undefined;
					existing_categories[chosenCategoryIndex].status = updateData.status;

					MaterialCategories.update({ branch_id: result.branch_id },
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

exports.getCategoryWithItems = (req, res) => {

}