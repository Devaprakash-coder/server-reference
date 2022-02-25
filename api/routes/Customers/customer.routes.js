'use strict';
const express = require('express');
const router = express.Router();
const Customer = require('../../controllers/CustomersController/customer.controller');
const QRController = require('../../controllers/qr.controller');
const Order = require('../../controllers/omsController/order.controller');

// router
//     .route('/homePage')
//     .get(Customer.getCustomer)

// router
//     .route('/home/:customerId')
//     .get(Customer.getHomedetails)

router 
    .route('/scan')
    .post(QRController.ScanLogin)

router
    .route('/order')
    // .post(Order.addOrder)

module.exports = router;