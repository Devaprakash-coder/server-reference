'use strict';
const express = require('express');
const router = express.Router();

const Table = require('../controllers/omsController/table.controller');
const Order = require('../controllers/omsController/order.controller');
const Bill = require('../controllers/omsController/billController');
const orderHistory = require('../controllers/historyController/order_history.controller');
const billHistory =  require('../controllers/historyController/bill_history.controller');
const vehicleHistory = require('../controllers/historyController/vehicle_history.controller')

/**
 * Bill History
 */
router
    .route('/bills')
    .get(Bill.getBillHistory)
    .post(Bill.checkoutTable)
    .patch(Bill.UpdateTender)

// router
//     .route('/bills/:branchId')
//     .get(billHistory.getBillHistory)

router
    .route('/bills/:branchId/:fromDate/:toDate/:timezonect/:timezonearea')
    .post(billHistory.getBillHistory)

/**
 * Order History
 */
router
    .route('/orders')
    .get(orderHistory.getOrderHistory)
    // .post(orderHistory.addOrderHistory)

router
    .route('/order/:orderId')
    .get(orderHistory.getCompletedOrderById)

// router
//     .route('/branch/h/orders/')
//     .get(orderHistory.getBranchOrderHistory)    

router
    .route('/branch/h/orders/:limitCount')
    .get(orderHistory.getBranchOrderHistory)

// router
//     .route('/branch/l/orders')
//     .get(orderHistory.getBranchOrderHistory)

router
    .route('/myorders')
    .get(orderHistory.getHistoryUserOrderHistory)

/**
 * Table History
 */
// router
//     .route('/tables')
//     .get(Table.getTableHistory)
//     .post(Bill.addTableHistory)

/**
 *  User History 
 */
//NOTE: Will be useful in tracking user records
// router
//     .route('/users')
//     .get(Bill.getUserHistory)
//     .post(Bill.addUserHistory)

/**
 * Velet History
 */
router
    .route('/vehicles/:branchId')
    .get(vehicleHistory.getVehiclesHistory)

module.exports = router;