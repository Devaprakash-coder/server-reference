'use strict';

const express = require('express');
const router = express.Router();

const Table = require('../controllers/omsController/table.controller');
const Order = require('../controllers/omsController/order.controller');
const Pettycash = require('../controllers/omsController/petty_cash.controller');
const Bill = require('../controllers/omsController/billController');
const Discount = require('../controllers/omsController/discountController');
const Service =  require('../controllers/omsController/serviceController');
const Feedback = require('../controllers/common/feedback.controller');

/*  
*  Table Routes
*/
router
    .route('/tables')
    /* .get(Table.getAllTables)  //since there is no option for getting all tables of company. may be in future */
    .post(Table.addTable)
    .put(Table.updateTable)
    .patch(Table.removeTable)

router
    .route('/table')
    .post(Table.shiftTable)
    .put(Table.mergeTable)   //NOTE: Option for merging table
    .patch(Table.resetTable)   //NOTE: Option for merging table

router
    .route('/unmerget')
    .put(Table.unmergeTable)

router
    .route('/table/:tableId')
    .get(Table.getTable)


router
    .route('/tables/:branchId')
    .get(Table.getBranchTables)

router
    .route('/tables/:branchId/:floorId')
    .get(Table.getBranchTables)
    .patch(Table.resetTableAlert)

/** 
 * Orders Routes
*/
router
    .route('/orders')
    .get(Order.getBranchOrders)
    .post(Order.addOrder)
    .put(Order.updateOrder)
    .patch(Order.updateOrderStatus)

router
    .route('/order/:orderId')
    .get(Order.getOrderById)
    .put(Order.updateOrderById)

router
    .route('/orders/:orderId')
    .put(Order.updateOrderById)

router
    .route('/sc/')
    .patch(Order.removeServiceCharge)

// router
//     .route('/orders/:branchId')
//     .get(Order.getBranchOrders) //Advanced API can be utilized in future

// router
//     .route('/orders/:branchId/:tableId')
//     .get(Order.getBranchOrders)

/**
 * Note: This API Will act as a dynamic one,
 * it differs based on the user accessTypes
 * Previous API is commented Above
 */
router
    .route('/orders/:param1/:param2/:param3')
    .get(Order.getBranchOrders);

router
    .route('/orders/:param1/:param2')         //NOTE: Used in User request for getting Orders
    .get(Order.getBranchOrders)


router
    .route('/orders/:param1')
    .get(Order.getBranchOrders)
    .delete(Order.deleteOrder)

router
    .route('/myorders')
    .get(Order.getUserOrders)

router
    .route('/myorders/all')
    .get(Order.getAllOrdersOfUser)

router
    .route('/myorders/all/:paginationCount')
    .get(Order.getAllOrdersOfUser)
// router
//     .route('/orders/:param1/')
//     .get(Order.getBranchOrders)

/**
 * Home delivery orders
 */
router
    .route('/homeorders')
    .get(Order.getAllHomeDelivery)


router
    .route('/homeorders/:branchId')
    .get(Order.getHomeDelivery)

router
    .route('/homeorders/:branchId/:deliveryId')
    .get(Order.getHomeDelivery)


/**
 * Takeaway Orders
 */
router
    .route('/takeaways')
    .get(Order.getAllTakeaways)


router
    .route('/takeaways/:branchId')
    .get(Order.getTakeaways)

router
    .route('/takeaways/:branchId/:orderId')
    .get(Order.getTakeaways)

/**
 * Service Routes
 */
router
    .route('/services/')
    .put(Service.updateQuickService)
    .patch(Service.updateServiceStatus)
    .delete(Service.removeQuickService)

router
    .route('/services/:orderId')
    .get(Service.getQuickService)

router
    .route('/services/:orderId/:status')
    .get(Service.getQuickService)

//TODO: Quick Service history


/**
 * Item Routes
 */
router
    .route('/item/')
    .put(Order.updateItemStatus)
    .patch(Order.updateItemQuantity)
router
    .route('/item/kds/')
    .put(Order.updateOrderKdsStatus)
router
    .route('/item/:itemId')
    .patch(Order.removeItem)


/**
 * Petty cash Routes
 */
router
    .route('/pettycash')
    .get(Pettycash.getPettyCash)
    .post(Pettycash.addPettyCash)
    .put(Pettycash.updatePettyCash)
    .patch(Pettycash.removePettyCash)
    .delete(Pettycash.deletePettyCash)

/**
 * Bills Routes
 */
router
    .route('/bills')
    .get(Bill.getBills)
    .post(Bill.addBill)
    .put(Bill.updateBill)
    .patch(Bill.updateBillStatus)
    
router.route('/bills/:billId')
    .delete(Bill.DeleteBill)
// router
//     .route('/bills/:tableId')
//     .get(Bill.getBills) //get bills of order

router
    .route('/bills/:type/:typeId')
    .get(Bill.getBills) //get bills of orderrouter

// router
//     .route('/bills/takeaway/:takeawayId')
//     .get(Bill.getBills) //get bills of order

// router
//     .route('/bills/delivery/:deliveryId')
//     .get(Bill.getBills) //get bills of order

// router
//     .route('/bills/:tableId/:branchId')
//     .get(Bill.getBills) //get bills of order

/**
 * Discount Routes
 */
router
    .route('/discounts')
    .post(Discount.addDiscount)
//     .put(Discount.updateDiscount) //TODO   
//     .patch(Discount.removeDiscount) //TODO
    // .delete(Discount.deleteDiscount) //TODO


router
    .route('/discounts/order/:orderId')
    .delete(Order.removeOrderDiscount)

router
    .route('/discounts/order/:orderId/item/:itemId')
    .delete(Order.removeItemDiscount)

// router
//     .route('/discounts/:orderId')
//     .get(Discount.getDiscount) //TODO

/**
 * QR ACTIONS
 */
router
    .route('/feedback')
    .get(Feedback.getBranchFeedback)
    .put(Feedback.addFeedback)

module.exports = router;

