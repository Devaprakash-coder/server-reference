'use strict';
const express = require('express');
const router = express.Router();
const User = require('../models/auth.model');
const jwt = require('jsonwebtoken');
const authController = require('../controllers/auth.controller');
const companyController = require('../controllers/company.controller');
const Customer = require('../controllers/managementController/customer_directory.controller');
const Mailer = require('../controllers/common/mail.controller');

/**
 * BASE ROUTE
 */
router
    .route('/')
    .get((req, res) => { res.send('Hello Authentication') });  // UNUSED

/**
 * REGISTER ROUTE
 */
router
    .route('/register')
    .post(authController.register_user);    // UNUSED

router
    .route('/registercompany')
    .post(companyController.add_new_details);

router
    .route('/registercustomer')
    .post(Customer.registerCustomer)

/**
 * MEMBER PIN ROUTE
 */
router
    .route('/memberpin')
    .post(authController.pin_login);

/**
 * LOGIN ROUTE
 */
router
    .route('/login')
    .post(authController.login_user);

router
    .route('/logincustomer')
    .post(Customer.loginCustomer);

router
    .route('/sociallogin')
    .post(Customer.socialLogin);

router
    .route('/forget')
    .post(Mailer.passwordReset)

router
    .route('/reset/:tokenKey')
    .post(Mailer.resetPassword)
    .get(authController.validate_reset_token)

module.exports = router;