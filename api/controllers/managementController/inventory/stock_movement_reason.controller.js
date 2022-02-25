const StockMovementReasonCollection = require('./../../../models/managementModels/inventory/stock_movement-reasons.model');

exports.getStockMovementReasonsOfBranch = (req, res) => {
    if (req.accessType === "superadmin" || req.accessType === "admin" || req.accessType === "staffs") {
        if(req.params.branchId) {
            StockMovementReasonCollection.find({ branch_id: req.params.branchId }, (err,  stockMovementReasons) => {
                if(err) {
                    res.status(500).json({
                        status: 0,
                        message: "error getting stock movement reasons",
                        error: 'invalid parameters'
                    });
                } else if(!stockMovementReasons.length) {
                    res.status(404).json({
                        status: 1,
                        message: "no reasons found"
                    });
                } else {
                    res.status(200).json({
                        status: 1,
                        message: "stock movement reasons obtained successfully",
                        data: stockMovementReasons
                    });
                }
            } )
        } else {
            res.status(401).json({
                status: 0,
                message: "error getting stock movement reasons",
                error: 'invalid parameters'
            }); 
        }
    }else{
        res.status(401).json({
            status: 0,
            message: "error getting stock movement reasons",
            error: 'invalid access'
        }); 
    }
}

exports.updateStockMovementReasons = (req, res) => {
    let reason_details = req.body.stock_reason_details;
	if (req.accessType === "superadmin" || req.accessType === "admin" || req.accessType === "staffs") {
        //Tips: Improve this with async/ await if have time
        if (!reason_details._id) {
            //new reason
            let stockReason = [];
            stockReason.company_id = req.companyId;
            stockReason.branch_id = reason_details.branch_id;
            stockReason.title = reason_details.title;
            stockReason.action = reason_details.action;

            let stock_reason = new StockMovementReasonCollection(stockReason);

            stock_reason.save((err, savedReason) => {
                if (err) {
                    console.error({
                        status: 0,
                        message: "Error saving stock reason!",
                        error: err
                    });
                    res.status(500).json({
                        status: 0,
                        message: "error saving stock reason!",
                        error: "problem with server"
                    });
                } else {
                    res.status(201).json({
                        status: 1,
                        message: "stock reason added successfully",
                        data: savedReason
                    });
                }
            });
        } else {
            //existing reason
            StockMovementReasonCollection.findById(reason_details._id, async (err, existingReason) => {
                if (err) {
                    console.error({
                        status: 0,
                        message: "Error finding reason",
                        error: err
                    });
                    res.status(500).json({
                        status: 0,
                        message: "Error finding reason for the passed parameter",
                        error: "Problem with server"
                    });
                } else{
                    existingReason.set(reason_details);

                    /**
                     *  TODO need to restrict the returning data
                     * Try to handle it from the front end
                     * */
                    existingReason.save((err, updatedReason) => {
                        if (err) {
                            console.error({
                                status: 0,
                                message: "error updating stock movement reason",
                                error: err
                            });
                            res.status(500).json({
                                status: 0,
                                message: "error updating stock movement reason",
                                error: "problem with server"
                            });
                        }else{
                            res.status(201).json({
                                status: 1,
                                message: "stock movement reason updated successfully",
                            });
                        }
                    });
                }
            });
        }
    } else {
        res.status(401).json({
            status: 0,
            message: "error adding stock movement reason",
            error: 'invalid access'
        });
    }
}

exports.removeStockMovementReasons = (req, res) => {
    let reason_details = req.body.stock_reason_details;
    if(reason_details._id){
        StockMovementReasonCollection.remove({ _id: reason_details._id }, (err, removedStatus) => {
            if(removedStatus.n && removedStatus.n === 1) {
                res.status(201).json({
                    status: 1,
                    message: "stock movement reason removed successfully"
                });
            } else {
                res.status(400).json({
                    status: 0,
                    message: "error removing stock movement reason",
                    error: "invalid paramters"
                });
            }
        })
    } else {
        res.status(400).json({
            status: 0,
            message: "error removing stock reason",
            error: 'invalid paramters'
        });
    }
}