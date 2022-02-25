'use strict'
const VehicleHistory = require('../../models/history/valet/vehicle_history.model')

/**
 * Used to get a whole branch history of vehicles transactions
 */
exports.getVehiclesHistory = (req, res) => {
    let branchId = req.params.branchId;
    if(!branchId) {
        res.status(400).json({
            status: 0,
            message: 'invalid parameters',
            error: 'please pass your branch id'
        })
    } else{
        VehicleHistory.find({ branch_id: branchId }, (err, vehicleList) => {
            if(err) {
                console.error({
                    status: 0,
                    message: 'error finding vehicles',
                    error: err
                })
                res.status(500).json({
                    status: 0,
                    message: 'error finding vehicles',
                    error: 'problem with the server'
                })
            }else if(!vehicleList.length) {
                res.status(200).json({
                    status: 1,
                    message: 'no vehicles found for this branch',
                    data: []
                })
            }else{
                res.status(200).json({
                    status: 1,
                    message: 'vehicles obtained successfully',
                    data: vehicleList
                })
            }
        })
        
    }
}
