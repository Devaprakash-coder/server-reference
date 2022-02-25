const Supplier = require('../../../models/managementModels/inventory/suppliers_list.model');
const SupplierMaterials = require('../../../models/managementModels/inventory/suppliers_materials.model');

/**
 * @description used both for add and update
 */
exports.getBranchSupplierMaterials = (req, res) => {
    let branchId;
    let supplierId = req.params.supplierId;
	if (supplierId && (req.accessType === "superadmin" || req.accessType === "admin" || req.accessType === 'staffs')) {
		branchId = req.params.branchId;
		getSupplierMaterials();
	} else if(!supplierId) {
		res.status(400).json({ 
            status: 0,
            message: 'invalid parameters'
         });
        //  res.end();
	}else{
		res.status(401).json({ 
            status: 0,
            message: 'unauthorized access'
         });
        //  res.end();
    }

	function getSupplierMaterials() {
		SupplierMaterials.findOne({ branch_id: branchId, supplier_id: supplierId }, async (err, suppliers) => {
			if (err) {
				res.status(500).json({
					status: 0,
					message: 'error finding suppliers',
					error: 'problem with the server'
				});
			} else {
                if(suppliers) {
                    res.status(200).json({
                        status: 1,
                        message: 'suppliers obtained successfully',
                        data: suppliers
                    });
                }else{
                    res.status(200).json({
                        status: 1,
                        message: 'no suppliers available found for the branch',
                        data: {}
                    });
                }
               

			}
		})
	}
}

/**
 * @description used both for add and update
 */
exports.updateSupplierMaterials = (req, res) => {
    let material_details = req.body.material_data;
	if (req.accessType === "superadmin" || req.accessType === "admin" || req.accessType === "staffs") {
		//Tips: Improve this with async/ await if have time
        SupplierMaterials.findOne({ branch_id: material_details.branch_id ,  supplier_id: material_details.supplier_id  }, (err, existingMaterials) => {
            if (err) {
                console.error({
                    status: 0,
                    message: 'error finding materials',
                    error: err
                });
                res.status(500).json({
                    status: 0,
                    message: 'error finding materials',
                    error: 'Problem with the server'
                });
            } else {
                if(!existingMaterials) {
                    res.status(400).json({
                        status: 0,
                        message: 'invalid paramters'
                    })
                }else{
                    if(material_details._id) {
                        //existing material
                        SupplierMaterials.update(
                            { "materials._id": material_details._id },
                            {
                                $set: { "materials.$": material_details }
                            },
                            (err, result) => {
                                if(err) {
                                    console.error({
                                        status: 0,
                                        message: 'error updating material',
                                        error: err
                                    })
                                    res.status(500).json({
                                        status: 0,
                                        message: 'error updating material',
                                        error: 'problem with the server'
                                    });
                                }else{
                                    res.status(201).json({
                                        status: 1,
                                        message: 'material updated successfully',
                                    });
                                }
                            })
                    }else{
                        //new materiall
                        existingMaterials.materials.push({
                            material_name: material_details.material_name
                            , aggregate_rate: material_details.aggregate_rate
                            , material_code: material_details.material_code
                            , material_id: material_details.material_id
                            , material_category_id: material_details.material_category_id
                            , material_unit: material_details.material_unit
                            , short_unit: material_details.short_unit
                        });
                        existingMaterials.save().then((updatedMaterial) => {
                            res.status(201).json({
                                status: 1,
                                message: 'material updated successfully'
                            });
                        }).catch((err) => {
                            console.error({
                                status: 0,
                                message: 'error updating material',
                                error: err
                            });
                            res.status(201).json({
                                status: 0,
                                message: 'material updated successfully',
                                error: 'problem with the server'
                            });
                        })
                    }
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

exports.removeSupplierMaterials = (req, res) => {
    let material_details = req.body.material_data;
	if (req.accessType === "superadmin" || req.accessType === "admin" || req.accessType === "staffs") {
		if (material_details._id) {
			SupplierMaterials.update(
                { "branch_id": material_details.branch_id, supplier_id: material_details.supplier_id },
                {
                    $pull: { "materials" : { _id: material_details._id } } 
                },
                (err, result) => {
                    if(err) {
                        console.error({
                            status: 0,
                            message: 'error updating material',
                            error: err
                        })
                        res.status(500).json({
                            status: 0,
                            message: 'error updating material',
                            error: 'problem with the server'
                        });
                    }else{
                        res.status(201).json({
                            status: 1,
                            message: 'material updated successfully',
                        });
                    }
                })
		} else if (!material_details._id) {
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