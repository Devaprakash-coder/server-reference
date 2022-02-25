'use strict';

const express = require('express');
const router = express.Router();
const vehicleController = require('../controllers/valetController/vehicle/vehicle.controller')

router
    .route('/vehicles')
    .put(vehicleController.updateVehicle)

router
    .route('/vehicles/:branchId')
    // .get(vehicleController.vehicleListCahe, vehicleController.getBranchVehicles)
    .get(vehicleController.getBranchVehicles)

router
    .route('/vehicle/:valetId')
    // .get(vehicleController.vehicleCahe, vehicleController.getVehicleDetails)
    .get(vehicleController.getVehicleDetails)
    .delete(vehicleController.removeVehicle)

module.exports = router;
