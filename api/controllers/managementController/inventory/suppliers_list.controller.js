const Supplier = require('../../../models/managementModels/inventory/suppliers_list.model');
const SupplierMaterials = require('../../../models/managementModels/inventory/suppliers_materials.model');

/**
 * @description
 * brancWise suppliers for admins param branchId is not mandatory
 */
exports.getBranchSupplierList = (req, res) => {
    let query_value;
	if (req.accessType === 'superadmin' || req.accessType === 'admin' || req.accessType === 'staffs') {
		query_value = req.params.branchId;
		getSuppliers();
	} else {
		res.status(401).send({ 'message': 'Unautorized Access' });
	}

	function getSuppliers() {
		Supplier.aggregate([
			{ $match: { branch_id: query_value } },	
		], async (err, suppliers) => {
			if (err) {
				res.status(500).json({
					status: 0,
					message: 'error finding suppliers',
					error: 'problem with the server'
				});
			} else {
                if(suppliers.length) {
                    res.status(200).json({
                        status: 1,
                        mssage: 'suppliers obtained successfully',
                        data: suppliers
                    });
                }else{
                    res.status(200).json({
                        status: 1,
                        mssage: 'no suppliers available found for the branch',
                        data: []
                    });
                }
               

			}
		})
	}
}

/**
 * @description used both for add and update
 */
exports.updateSupplierList = (req, res) => {
    let supplier_details = req.body.supplier_data;

	if (req.accessType === "superadmin" || req.accessType === "admin" || req.accessType === "staffs") {
		//Tips: Improve this with async/ await if have time
        Supplier.aggregate([{ 
            $match:  { 
                branch_id: supplier_details.branch_id , 
                category_id: supplier_details.category_id 
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
                if (!supplier_details._id) {
                    //new supplier
                    let supplierData = [];
                    supplierData.company_id = req.companyId;
                    supplierData.branch_id = supplier_details.branch_id;
                    supplierData.name = supplier_details.name;
                    supplierData.contact = supplier_details.contact;
                    supplierData.address = supplier_details.address;
                    supplierData.po_prefix = supplier_details.po_prefix;

                    let supplier = new Supplier(supplierData);

                    supplier.save((err, savedSupplier) => {
                        if (err) {
                            console.error({
                                status: 0,
                                message: "Error saving item!",
                                error: err
                            });
                            res.status(500).json({
                                status: 0,
                                message: "error saving supplier!",
                                error: "problem with server"
                            });
                        } else {
                            let supplier_materials = new SupplierMaterials({
                                branch_id: supplier_details.branch_id, 
                                company_id: req.companyId, 
                                supplier_name: supplier_details.name, 
                                supplier_id: savedSupplier._id, 
                                supplier_po_prefix: savedSupplier.po_prefix,  //TODO: consider
                                materials: []
                            });

                            supplier_materials.save().then(() => {
                                res.status(201).json({
                                    status: 1,
                                    message: "supplier added successfully",
                                    data: savedSupplier
                                });
                            }).catch((err) => {
                                res.status(500).json({
                                    status: 0,
                                    message: "error updating supplier data",
                                    error: 'problem with the server'
                                });
                            });
                        }
                    });
                } else {
                    //existing suppplier
                    Supplier.findById(supplier_details._id, async (err, existingSupplier) => {
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
                        } else{
                            existingSupplier.set(supplier_details);

                            /**
                             *  TODO need to restrict the returning data
                             * Try to handle it from the front end
                             * */
                            existingSupplier.save((err, updatedSupplier) => {
                                if (err) {
                                    console.error({
                                        status: 0,
                                        message: "error updating supplier",
                                        error: err
                                    });
                                    res.status(500).json({
                                        status: 0,
                                        message: "error updating item",
                                        error: "problem with server"
                                    });
                                }else{
                                    res.status(201).json({
                                        status: 1,
                                        message: "supplier updated successfully",
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
			error: 'user not have access to create or update suppliers'
		});
		res.status(401).send({
			status: 0,
			message: "UnAuthorized Access",
			error: 'you do not have access to create or update suppliers'
		});
	}
}

exports.removeSupplierList = (req, res) => {
    let updateData = req.body.supplier_data;
	if (req.accessType === "superadmin" || req.accessType === "admin" || req.accessType === "staffs" ) {
		if (updateData._id) {
			Supplier.findOneAndRemove({ '_id': updateData._id }, (err, result) => {
				if (err) {
					console.error({
						status: 0,
						message: 'error removing supplier',
						error: err
					});
					res.status(500).json({
						status: 0,
						message: 'error removing supplier',
						error: 'problem with the server'
					});
				} else {
                    res.status(201).json({
                        status: 1,
                        message: 'category removed successfully',
                    });
				}
			});
		} else if (!updateData._id) {
            res.status(404).json({
                status: 0,
                messsage: 'no supplier found'
            });
		}
	} else {
		res.status(401).json({
            status: 0,
            messsage: 'unauthorized access'
        });
	}
}