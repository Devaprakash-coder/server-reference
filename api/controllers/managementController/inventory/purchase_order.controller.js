const PurchaseOrder = require('../../../models/managementModels/inventory/purchase_order.model');
const MaterialStock = require('../../../models/managementModels/inventory/material_stocks.model');
const MaterialStockController = require('./material_stocks.controller');
/**
 * @description used both for add and update
 */
exports.getPurchaseOrdersOfBranch = (req, res) => {
    let branchId = req.params.branchId;
    let supplierId = req.params.supplierId;
	if (branchId && supplierId &&  (req.accessType === "superadmin" || req.accessType === "admin" || req.accessType === 'staffs')) {
		getPurchaseOrders();
	} else if (!supplierId || branchId ) {
		res.status(400).json({ 
            status: 0,
            message: 'invalid parameters'
         });
	} else{
		res.status(401).json({ 
            status: 0,
            message: 'unauthorized access'
         });
	}

	function getPurchaseOrders() {
		PurchaseOrder.find({ branch_id: branchId, supplier_id: supplierId, order_status: 'saved' }, async (err, existingOrders) => {
			if (err) {
				res.status(500).json({
					status: 0,
					message: 'error finding purchase orders',
					error: 'problem with the server'
				});
			} else {
                if(existingOrders && existingOrders.length) {
                    res.status(200).json({
                        status: 1,
                        message: 'purchase order obtained successfully',
                        data: existingOrders
                    });
                }else{
                    res.status(200).json({
                        status: 1,
                        message: 'no purchase order available found for the branch',
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
exports.getPurchaseOrderById = (req, res) => {
    let purchaseOrderId = req.params.purchaseId;
	if (purchaseOrderId && (req.accessType === "superadmin" || req.accessType === "admin" || req.accessType === 'staffs')) {
		getPurchaseOrders();
	}else if(!purchaseOrderId){
        res.status(400).json({ 
            status: 0,
            message: 'invalid parameters',
            error: 'invalid order id'
         });
    } else{
		res.status(401).json({ 
            status: 0,
            message: 'unauthorized access'
         });
	}

	function getPurchaseOrders() {
		PurchaseOrder.findOne({ _id: purchaseOrderId }, async (err, existingOrder) => {
			if (err) {
				res.status(500).json({
					status: 0,
					message: 'error finding purchase order',
					error: 'problem with the server'
				});
			} else {
                if(existingOrder) {
                    res.status(200).json({
                        status: 1,
                        message: 'purchase order obtained successfully',
                        data: existingOrder
                    });
                }else{
                    res.status(200).json({
                        status: 1,
                        message: 'no purchase order available found for the branch',
                        data: {}
                    });
                }
               

			}
		})
	}
}

/**
 * @description for getting whole branch purchase orders independent of supplier
 * @param ['branchId', 'limit', 'fromDate', 'toDate']
 */
exports.getLimitedPurchaseOrdersOfBranch = (req, res) => {
    let branchId = req.params.branchId;
    let limit_value = Number(req.params.limit);
    let fromDate = new Date(Number(req.params.fromDate));
    let toDate = new Date(Number(req.params.toDate));
    let status = req.params.status;

    if(status && branchId && limit_value && fromDate && toDate && (req.accessType === "superadmin" || req.accessType === "admin" || req.accessType === 'staffs')){
        getLimitedOrders(status);
    } else if (!branchId || !limit_value || !fromDate || !toDate) {
		res.status(400).json({ 
            status: 0,
            message: 'invalid parameters'
         });
	} else{
		res.status(401).json({ 
            status: 0,
            message: 'unauthorized access'
         });
	}

	function getLimitedOrders(status) {
        let query;
        if(status === 'all') {
            query = { branch_id: branchId, purchase_issued_date: { $gte: fromDate, $lt: toDate } }
        }else{
            query = { branch_id: branchId, purchase_issued_date: { $gte: fromDate, $lt: toDate }, order_status: status}
        }

        PurchaseOrder.find(query).sort({ purchase_issued_date: -1 }).limit(limit_value)
        .then((existingOrders) => {
            if(existingOrders && existingOrders.length) {
                res.status(200).json({
                    status: 1,
                    message: 'purchase order obtained successfully',
                    data: existingOrders
                });
            }else{
                res.status(200).json({
                    status: 1,
                    message: 'no purchase order available found for the branch',
                    data: []
                });
            }
        }).catch((err) => {
            res.status(500).json({
                status: 0,
                message: 'error finding purchase orders',
                error: 'problem with the server'
            });
        })
	}
}

/**
 * @description used both for add and update
 */
exports.updatePurchaseOrders = async (req, res) => {
    // let material_details = req.body.material_data;
    let purchase_details = req.body.purchase_data;
    let branchId = purchase_details.branch_id;
	if (branchId &&  (req.accessType === "superadmin" || req.accessType === "admin" || req.accessType === "staffs")) {
        //Tips: Improve this with async/ await if have time
        purchase_details.branch_id = branchId;
        purchase_details.company_id = req.companyId;
        if(purchase_details._id) {
            //existing purchase
            PurchaseOrder.findOne({ _id: purchase_details._id }, (err, existingPurchaseOrder) => {
                if(err) {
                    console.error({
                        status: 0,
                        message: 'error updating purchase order',
                        error: err
                    })
                    res.status(500).json({
                        status: 0,
                        message: 'error updating purchase order',
                        error: 'problem with the server'
                    });
                }else{  
                    let updatedPurchaseDetails = existingPurchaseOrder.set(purchase_details);
                    updatedPurchaseDetails.save().then((result) => {
                        res.status(201).json({
                            status: 1,
                            message: 'purchase order updated successfully',
                            data: result
                        });
                    }).catch((err) => {
                        console.error({
                            status: 0,
                            message: 'error updating purchase order',
                            error: err
                        });
                        res.status(500).json({
                            status: 0,
                            message: 'error updating purchase order',
                            error: 'problem with the server'
                        });
                    })         
                }
            })
        }else{
            //new materiall
            purchase_details.purchase_order_id = await updateCount(branchId, 'kot');
            purchase_details.order_id_prefix = purchase_details.supplier_po_prefix ? `PO/${purchase_details.supplier_po_prefix}/` : 'PO/';
            purchase_details.order_id_suffix = getCurrentFinancialYear();

            function getCurrentFinancialYear() {
                var financial_year = "";
                var today = new Date();
                if ((today.getMonth() + 1) <= 3) {
                    financial_year = String(today.getFullYear() - 1).substr(2,2) + "-" + String(today.getFullYear()).substr(2,2)
                } else {
                    financial_year = String(today.getFullYear()).substr(2,2) + "-" + String(today.getFullYear() + 1).substr(2,2)
                }
                return financial_year;
            }

            let newPurchaseOrder = new PurchaseOrder(purchase_details);
            newPurchaseOrder.save().then((result) => {
                res.status(201).json({
                    status: 1,
                    message: 'purchase order added successfully',
                    data: result
                });
            }).catch((err) => {
                console.error({
                    status: 0,
                    message: 'error adding purchase order',
                    error: err
                });
                res.status(500).json({
                    status: 0,
                    message: 'error adding purchase order',
                    error: 'problem with the server'
                });
            })           
        }
    }else if(!branchId) {
        console.error({
			status: 0,
			message: "invalid paramters",
			error: 'no branch id passed'
		});
		res.status(401).send({
			status: 0,
			message: "invalid paramters",
			error: 'no branch id found'
		});
    } else {
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

exports.removePurchaseOrder = (req, res) => {
    let purchaseId = req.params.purchaseId;
	if (req.accessType === "superadmin" || req.accessType === "admin" || req.accessType === "staffs") {
		if (purchaseId) {
			PurchaseOrder.findByIdAndRemove(purchaseId,
                (err, result) => {
                    if(err) {
                        console.error({
                            status: 0,
                            message: 'error removing purchase order',
                            error: err
                        })
                        res.status(500).json({
                            status: 0,
                            message: 'error removing purchase order',
                            error: 'problem with the server'
                        });
                    }else{
                        res.status(201).json({
                            status: 1,
                            message: 'order removed successfully',
                        });
                    }
                })
		} else if(!purchaseId) {
            res.status(404).json({
                status: 0,
                messsage: 'invalid parameters'
            });
		}
	} else {
		res.status(401).json({
            status: 0,
            messsage: 'unauthorized access'
        });
	}
}
/**
 * @description onl for updating order status
 * @requires order_status
 */
exports.updatePurchaseStatus = (req, res) => {
    let purchase_details = req.body.purchase_data;
	if (req.accessType === "superadmin" || req.accessType === "admin" || req.accessType === "staffs") {
		if (purchase_details._id) {
			PurchaseOrder.update(
                { "branch_id": purchase_details.branch_id, supplier_id: purchase_details.supplier_id },
                {
                    $set: { "order_status" : purchase_details.order_status } 
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
		} else if (!purchase_details._id) {
            res.status(404).json({
                status: 0,
                messsage: 'no purchase order found'
            });
		}
	} else {
		res.status(401).json({
            status: 0,
            messsage: 'unauthorized access'
        });
	}
}

/**
 * @description onl for updating order status
 * @requires order_status
 */
exports.updateMaterialStatus = (req, res) => {
    let material_detail = req.body.purchase_data;
    if (req.accessType === "superadmin" || req.accessType === "admin" || req.accessType === "staffs") {
		if (material_detail._id) {
			PurchaseOrder.findOneAndUpdate(
                { "placed_material_list._id": material_detail._id },
                {
                    $set: { "placed_material_list.$" : material_detail } 
                },
                { "new": true, "upsert": true },
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
                        let material_stock_detail = { 
                            company_id: result.company_id
                            , branch_id: result.branch_id
                            , material_id: material_detail.material_id
                            , material_category_id: material_detail.material_category_id
                            , stock: {
                                    purchase_order_number: `${result.order_id_prefix}${result.purchase_order_id}/${result.order_id_suffix}`
                                    , available_quantity: material_detail.received_quantity
                                    , stock_quantity: material_detail.received_quantity
                                    , purchase_received_date: material_detail.received_at
                                }                        
                            }
                        MaterialStockController.updateMaterialStocks(material_stock_detail).then((result) => {
                              res.status(201).json({
                                status: 1,
                                message: 'material updated successfully',
                            });
                        }).catch((err) => {
                            res.status(201).json({
                                status: 1,
                                message: 'material updated successfully, error updating stocks',
                            });
                        })
                    }
                })
		} else if (!material_detail._id) {
            res.status(404).json({
                status: 0,
                messsage: 'no material found'
            });
		}
	} else {
		res.status(401).json({
            status: 0,
            messsage: 'unauthorized access'
        });
	}
}

async function updateCount(branchId, type) {	
    let purchase_order_list = await PurchaseOrder.find( { branch_id: branchId }).sort({_id:-1}).limit(1);

    if(purchase_order_list.length) {
		let new_kot_count;
        new_kot_count = await getnextValue(purchase_order_list[0].purchase_order_id);

		/**
		 * the purpose is only for kot,  
		 */
		async function getnextValue(value) {
			let isStartsWithNumber = value.match(/^\d/);
			let stringArray = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M',
							'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];
			if(isStartsWithNumber) {
				let nextDigit = String(Number(value) + 1);
				let next_number = (nextDigit.length < value.length ? pad("0" + nextDigit, value.length) : nextDigit);
				return next_number;
			}else{
			let thenum = value.replace( /^\D+/g, '');
			let indexString = value.charAt(0);
			let nextDigit = String(Number(thenum) + 1);
			let next_number = ( nextDigit.length < (value.length -1) ? pad("0" + nextDigit, (value.length -1)) : nextDigit);
					if(nextDigit.length == value.length) {
				next_number = next_number.slice(1, value.length);
				indexString = stringArray[stringArray.indexOf(indexString)+1];
			}
			return indexString+next_number;
			}
		}
		
		async function pad (str, max) {
			str = str.toString();
			return str.length < max ? pad("0" + str, max) : str;
		}

		return new_kot_count;
	} else{
		return "000000";
	}
}