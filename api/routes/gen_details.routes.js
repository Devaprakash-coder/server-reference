'use strict';

const express = require('express');
const router = express.Router();

const Categories = require('../controllers/managementController/menu_category.controller');
const Items = require('../controllers/managementController/menu_item.controller');
const Table = require('../controllers/omsController/table.controller');
const QR = require('../controllers/qr.controller');
const Mailer = require('../controllers/common/mail.controller');
const Recipe = require('../controllers/managementController/inventory/recipe.controller');
const Company = require('../controllers/company.controller');
const Branch = require('../controllers/branch.controller');

/**
 * Depricated
 * CATEGORIES 
 */
router
    .route('/categories')
    // .get(Categories.getCategoriesList)

/**
 * Item Call With No Auth Required
 */
router
    .route('/b/items/:branchId')
    .get(QR.getItemsOfBranch)
router
    .route('/items/:categoryId')
    .get(Items.getCategoryItems)

router
    .route('/items/:categoryId/:currentDate')
    .get(Items.getCategoryItems)

/** 
 * TABLES
 * NOTE: Changes are made as per Ashok Kumar's request for changes in latest Features
 */
router
    .route('/tables/:tableId')
    .get(QR.getTableDetails)  //used in mobile initial data loading
    // .post(Items.getTableList)
    // .put(Items.getTableList)
    // .patch(Items.getTableList)

/** 
 * TABLES
 */
router
    .route('/list/company')
    .get(Company.get_companies_list)

router
    .route('/list/branch/:companyId')
    .get(Branch.branch_list)

router
    .route('/list/floors/:branchId')
    .get(Table.getFloorList)

router
    .route('/list/tables/:floorId')
    .get(Table.getTablesOfFloor)

/**
 * QR ACTIONS
 */
router
    .route('/qr')
    .post(QR.ScanLogin)

router
    .route('/dummy')
    .get(QR.getStaticItemsOfBranch)

// router
//     .route('/test')
//     .get(Recipe.testFunction)

module.exports = router;