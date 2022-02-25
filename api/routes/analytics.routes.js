'use strict';

const express = require('express');
const router = express.Router();
const Sales = require('../controllers/analyticsController/sales.controller');

/**
 * Total Sales report
 */
// router
//     .route('/sales')
//     .get(Sales.getSalesReport)    

// router
//     .route('/sales/:branchId')
//     .get(Sales.getSalesReport)   

// router
//     .route('/sales/:fromDate/:toDate')
//     .get(Sales.getSalesReport)

router
    .route('/sales/:branchId/:fromDate/:toDate/:timezonect/:timezonearea')
    .get(Sales.getSalesReport)
router
.route('/sales/itemsreport')
.get(Sales.getitemlist)
/**
 * Item sales
 */
// router
//     .route('/items')
//     .get(Sales.getItemSalesReport)  

// router
//     .route('/items/b/:branchId')
//     .get(Sales.getItemSalesReport)

// router
//     .route('/items/f/:branchId/:fromDate')
//     .get(Sales.getItemSalesReport)  

// router
//     .route('/items/:fromDate/:toDate')
//     .get(Sales.getItemSalesReport)

router
    .route('/items/:branchId/:fromDate/:toDate/:timezonect/:timezonearea')
    .get(Sales.getItemSalesReport)

router
    .route('/discounts/:branchId/:fromDate/:toDate/:timezonect/:timezonearea')
    .get(Sales.getDiscountsReport)

router
    .route('/bills/:branchId/:fromDate/:toDate/:timezonect/:timezonearea')
    .get(Sales.getBills)

router
    .route('/taxes/:branchId/:fromDate/:toDate/:timezonect/:timezonearea')
    .get(Sales.getTaxReport)

router
    .route('/members/:branchId/:fromDate/:toDate/:timezonect/:timezonearea')
    .get(Sales.getMemberReport)
    
router
    .route('/table/:branchId/:fromDate/:toDate/:timezonect/:timezonearea')
    .get(Sales.getTableReport)
    
router
    .route('/bestitem/:branchId/:fromDate/:toDate/:timezonect/:timezonearea')
    .get(Sales.getBestSellerItem)

router
    .route('/newcustomercount/:branchId/:fromDate/:toDate/:timezonect/:timezonearea')
    .get(Sales.getNewCustomersCount)

router
    .route('/totalsales/:branchId/:fromDate/:toDate/:timezonect/:timezonearea')
    .get(Sales.getTotalSaleCost)

router
    .route('/totalunpaid/:branchId/:fromDate/:toDate/:timezonect/:timezonearea')
    .get(Sales.getTotalBillCost)
    
router
    .route('/customerretention/:branchId/:fromDate/:toDate/:timezonect/:timezonearea')
    .get(Sales.getCustomerRetention)

router
    .route('/tableturnover/:branchId/:fromDate/:toDate/:timezonect/:timezonearea')
    .get(Sales.getTableTurnOver)

router
    .route('/averagecover/:branchId/:fromDate/:toDate/:timezonect/:timezonearea')
    .get(Sales.getAverageCover)

router
    .route('/branchprofit/:branchId/:fromDate/:toDate/:timezonect/:timezonearea')
    .get(Sales.getProfit)

/**
 * Sales Categories Reports
 */
// router
//     .route('/categories')
//     .get(Sales.getCategorySalesReport)  

// router
//     .route('/categories/:branchId')
//     .get(Sales.getCategorySalesReport) 

// router
//     .route('/categories/:fromDate/:toDate')
//     .get(Sales.getCategorySalesReport)

router
    .route('/categories/:branchId/:fromDate/:toDate/:timezonect/:timezonearea')
    .get(Sales.getCategorySalesReport)

/**
 * Sales Report based in Customer types
 */
// router  
//     .route('/customers')
//     .get(Sales.getCustomerTypeSalesReport)

router  
    .route('/customers/:branchId')
    .get(Sales.getCustomerTypeSalesReport)

// router
//     .route('/tender')
//     .get(Sales.getTenderTypeSalesReport)

// router
//     .route('/tender/:branchId')
//     .get(Sales.getTenderTypeSalesReport)

// router
//     .route('/tender/:fromDate/:toDate')
//     .get(Sales.getTenderTypeSalesReport)

router
    .route('/tender/:branchId/:fromDate/:toDate/:timezonect/:timezonearea')
    .get(Sales.getTenderTypeSalesReport)


module.exports = router;