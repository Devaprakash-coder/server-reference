'use strict';
const express = require('express');
const router = express.Router();
const paymentUpdateHook = require('../hooks/payment.hooks');
const ExternalOrderHook = require('../hooks/externalorder.hooks');
/**
 * Bill History
 */
router
    .route('/payment')
    .patch(paymentUpdateHook.updateBillStatus)

router
    .route('/getexternalorder')
    .post(ExternalOrderHook.addExternalOrder)
router
    .route('/updateexternalorder')
    .post(ExternalOrderHook.updateExternalOrder)
router
    .route('/riderstatuschange')
    .post(ExternalOrderHook.riderstatuschange)
router
    .route('/getresponse')
    .post(ExternalOrderHook.getresponse)

module.exports = router;