'use strict';
const express = require('express'),
    router = express.Router();
const DeliveryBrand = require('../controllers/managementController/menu_deliverybrand.controller');
/**
 * [Item , Category]
 */
const Category = require('../controllers/managementController/menu_category.controller'),
    Item = require('../controllers/managementController/menu_item.controller'),
    Offer = require('../controllers/managementController/offers.controllers'),
    Coupon = require('../controllers/managementController/coupon.controller');
/**
 * [Customer, Members]
 */
const CustomerType = require('../controllers/managementController/customer_type.controller'),
    Customer = require('../controllers/managementController/customer_directory.controller'),
    Member = require('../controllers/managementController/member.controller'),
    Reservation = require('../controllers/managementController/reservation.controller');

/**
 * [General]
 */
const Meta = require('../controllers/managementController/custom_meta.controller');
/**
 * [Invetory]
 */
const MaterialCategories = require('../controllers/managementController/inventory/material_category.controller'),
    MaterialItems = require('../controllers/managementController/inventory/material_item.controller'),
    SupplierList = require('../controllers/managementController/inventory/suppliers_list.controller'),
    SupplierMaterials = require('../controllers/managementController/inventory/suppliers_materials.controller'),
    PurchaseOrders = require('../controllers/managementController/inventory/purchase_order.controller'),
    InventoryCharacteristics = require('../controllers/managementController/inventory/characteristics.controller'),
    Recipe = require('../controllers/managementController/inventory/recipe.controller'),
    StockMovement = require('../controllers/managementController/inventory/stock_movement.controller'),
    StockMovementReason = require('../controllers/managementController/inventory/stock_movement_reason.controller'),
    MaterialStocks = require('../controllers/managementController/inventory/material_stocks.controller'),
    StockLocation = require('../controllers/managementController/inventory/stock_locations.controller');

/**
 * Home Route (Dummy)
 */
router.route("/").get((req, res) => {
    res.send("Management Module API");
});

/**
 *  @name CATEGORY
 * Categories Route
 */
router
    .route('/categories')
    .post(Category.addCategory)
    .put(Category.updateCategory)
    .patch(Category.softRemove)

/**
 * @name BRANCH
 * Get categories of particualr branch
 * @param branchId
 */
router
    .route('/branch_categories/:branchId')
    .get(Category.getBrachCategories);

/**
 * Get single Category
 * @param categoryId
 */
router
    .route('/categories/:categoryId')
    .get(Category.getCategory)


/**
 * @name ITEM_ROUTES
 */
router
    .route('/items')
    .get(Item.getAllItemsOfCompany)
    .put(Item.updateItem)
    .patch(Item.itemRemove)


    router
    .route('/items/delete')
    .patch(Item.hard_remove)
/**
 * @description Get Items of particular category
 * @param categoryId
 */
router
    .route('/items/:categoryId')
    .get(Item.getCategoryItems)

/**
 * @description Get Items Of Particular day
 * @params categoryId, dayName
 */
router
    .route('/items/:categoryId/:currentDate')
    .get(Item.getCategoryItems)


/**
 * @description Items Of particualr Branch
 */
router
    .route('/branch_items/:branchId')
    .get(Item.getAllItemsOfBranch)


/**
 * @notes Single_Item
 * @param itemId
 */
router
    .route('/item/:itemId')
    .get(Item.getItem)
    .put(Item.updateItemTag)

/* 
* Customer Routes 
    @notes: remove if c_type works, reedit customer routes in proper
*/
/* router
    .route('/customertype')
    .get(CustomerType.getCustomerTypes)
    .post(CustomerType.addCustomerType)
    .put(CustomerType.updateCustomerType)
    .patch(CustomerType.removeCustomerType) */


/* router
    .route('/c_type')
    .get(Customer.getCustomerTypes)
    .put(Customer.updateCustomerType)
    .patch(Customer.removeCustomerType) */

router
    .route('/customers')
    // .get(Customer.getCustomers)
    .get(Customer.getBrandCustomers)
    .post(Customer.addCustomer)
    .put(Customer.updateCustomer)
    .patch(Customer.removeCustomer)

router
    .route('/cus_address')
    .post(Customer.updateAddress)

/* router
    .route('/cus_visit')
    .put(Customer.IncreaseVisit) */

/**
 * @note [to increase vsit count]
 */
router
    .route('/customers/:customerId')
    .get(Customer.getCustomer)
    .patch(Customer.IncreaseVisit)

router
    .route('/customer/:branchId')
    .get(Customer.getBranchCustomers)

router
    .route('/customer-list/:companyId')
    .get(Customer.getBrandCustomers)


/**
 * @name MEMBER_POSIION_ROUTES
 */
/* router
    .route('/position')
    .get(CustomerType.getCustomerTypes)
    .post(CustomerType.addCustomerType)
    .put(CustomerType.updateCustomerType)
    .patch(CustomerType.removeCustomerType) */


/** Meta Routes */
router
    .route('/cus_types')
    .put(Meta.updateCustomerType)
    .patch(Meta.removeCustomerType)

router
    .route('/cus_types/:branchId')
    .get(Meta.getCustomerTypes)

router
    .route('/m_positions')
    .put(Meta.updateMemberPosition)
    .patch(Meta.removeMemberPosition)

router
    .route('/m_positions/:branchId')
    .get(Meta.getMemberPositions)

router
    .route('/m_position/:branchId')
    .get(Meta.getMemberPosition)

router
    .route('/quickoptions')
    .get(Meta.getServices)
    .put(Meta.updateService)
    .patch(Meta.removeService)

router
    .route('/reservations')
    .get(Reservation.getAllReservations)
    .post(Reservation.addReservation)
    .put(Reservation.updateReservation)
    .patch(Reservation.removeReservation)

router
    .route('/reservations/:reservationId')
    .get(Reservation.getReservations)

router
    .route('/reservation/:branchId')
    .get(Reservation.getBranchReservations)

/**
 * Member Position
 */
router
    .route("/m_positions/:positionId")
    .get(Member.get_branch_members)

router
    .route('/members')
    .post(Member.add_new_member)
    .put(Member.update_member)
    .patch(Member.remove_member)

router
    .route('/members/:branchId')
    .get(Member.get_branch_members)

router
    .route('/member')
    .get(Member.get_member)
    .post(Member.reset_member_pin)
    .patch(Member.updateTourStatus);

router
    .route('/member/:pin')
    .get(Member.validate_pin);

/**
 * @name TOKENS-GENERATION
 * @notes This route is reserved for generating new  TOKENS For the existing users
 */
router
    .route('/token/regenerate/:typeId')
    .get(Customer.regenerateToken)

router
    .route('/token/regenerate/')
    .get(Customer.regenerateToken)

/**
 * @name OFFERS
 */
router
    .route('/offers')
    .get(Offer.getBranchOffers)

router
    .route('/offers/:branchId')
    .get(Offer.getBranchOffers)

router
    .route('/offer')
    .get(Offer.getBranchOffers)
    .put(Offer.updateOffer)
    .patch(Offer.modifyOfferStatus)
    .delete(Offer.removeOffer)

router
    .route('/coupon')
    .get(Coupon.getOfferCoupons)
    .post(Coupon.createCoupon)
    .patch(Coupon.updateCouponStatus);

/**
 * Inventories Routes
 */
/**
 * @description 
 * This contains set of inventory characteristics
 */
router
    .route('/inventory/characteristics')
    .get(InventoryCharacteristics.getInventoryCharacteristicsOfBranch) //done
    .post(InventoryCharacteristics.updateInventoryCharacteristics) //checked
    .put(InventoryCharacteristics.updateInventoryCharacteristics) //checked

router
    .route('/inventory/characteristics/:branchId')
    .get(InventoryCharacteristics.getInventoryCharacteristicsOfBranch) //checked

router
    .route('/inventory/characteristics/:characteristicId')
    .delete(InventoryCharacteristics.removeInventoryCharacteristics)

/**
 * @description 
 * This contains set of inventory materials
 */
/**
 *  @name MATERIALS_CATEGORIES
 * Categories Route
 */
router
    .route('/inventory/materials-categories')
    .put(MaterialCategories.updateMaterialCategory)
    .patch(MaterialCategories.softRemove)

/**
* @name BRANCH_MATERIALS_CATEGORIES
* Get categories of particualr branch
* @param branchId
*/
router
    .route('/inventory/branch_material_categories/:branchId')
    .get(MaterialCategories.getBrachMaterialCategories);


/**
 * @description 
 * This contains set of inventory materials
 */
/**
 *  @name MATERIAL_ITEMS
 * Categories Route
 */
router
    .route('/inventory/items')
    .put(MaterialItems.updateItem)
    .patch(MaterialItems.softRemove)

router
    .route('/inventory/items/:itemId')
    .delete(MaterialItems.removeItem)


router
    .route('/inventory/items/:categoryId')
    .get(MaterialItems.getMaterialCategoryItems)

/**
* @name BRANCH_MATERIALS_ITEMS
* Get categories of particualr branch
* @param branchId
*/
router
    .route('/inventory/branch_items/:branchId')
    .get(MaterialItems.getAllItemsOfBranch);

/**
* Get single Material Category
* @param categoryId
*/
/* router
    .route('/categories/:categoryId')
    .get(MaterialCategories.getMaterialCategory) */


/**
 * @description 
 * This contains set of inventory suppliers
 */
router
    .route('/inventory/suppliers')
    .get(SupplierList.getBranchSupplierList)
    .put(SupplierList.updateSupplierList)
    .patch(SupplierList.removeSupplierList)

router
    .route('/inventory/suppliers/:branchId')
    .get(SupplierList.getBranchSupplierList)


/**
 * @description 
 * This contains set of inventory suppliers
 */
router
    .route('/inventory/supplier-materials')
    .put(SupplierMaterials.updateSupplierMaterials)
    .patch(SupplierMaterials.removeSupplierMaterials)

router
    .route('/inventory/supplier-materials/:supplierId')
    .get(SupplierMaterials.getBranchSupplierMaterials)

router
    .route('/inventory/supplier-materials/:supplierId/:branchId')
    .get(SupplierMaterials.getBranchSupplierMaterials)


/**
 * @description 
 * This contains set of purchase orders
 */
router
    .route('/inventory/purchases')
    .put(PurchaseOrders.updatePurchaseOrders)
    .patch(PurchaseOrders.updatePurchaseStatus)

router
    .route('/inventory/purchase/:purchaseId')
    .get(PurchaseOrders.getPurchaseOrderById)
    .delete(PurchaseOrders.removePurchaseOrder)

router
    .route('/inventory/purchase/material')
    .put(PurchaseOrders.updateMaterialStatus)

router
    .route('/inventory/purchases/:supplierId')
    .get(PurchaseOrders.getPurchaseOrdersOfBranch)

router
    .route('/inventory/purchases/:supplierId/:branchId')
    .get(PurchaseOrders.getPurchaseOrdersOfBranch)

router
    .route('/inventory/purchases/:branchId/:limit/:fromDate/:toDate')
    .get(PurchaseOrders.getLimitedPurchaseOrdersOfBranch)

router
    .route('/inventory/purchases/:branchId/:limit/:fromDate/:toDate/:status')
    .get(PurchaseOrders.getLimitedPurchaseOrdersOfBranch)


/**
 * Recipe for item
 */
router
    .route('/inventory/recipes')
    .put(Recipe.updateItemRecipe)

router
    .route('/inventory/recipe/:recipeId')
    .get(Recipe.getItemRecipe)
    .delete(Recipe.removeItemRecipe)

router
    .route('/inventory/recipes/:categoryId')
    .get(Recipe.getCategoryRecipes)


router
    .route('/inventory/recipes/:branchId/l/:limitedTo')
    .get(Recipe.getAllRecipes)

router
    .route('/inventory/recipes/full/:branchId')
    .get(Recipe.getFullRecipes)

router
    .route('/inventory/recipes/custom/:item_id')
    .get(Item.getCustomItemsOfRecipe)
/**
 * Material Stock Routes
 */
router
    .route('/inventory/material-stocks')
    .get(MaterialStocks.getMaterialStocks)
    .put(MaterialStocks.updateMaterialStocks)
    .delete(MaterialStocks.removeMaterialStocks)

router
    .route('/inventory/material-stocks/:categoryId')
    .get(MaterialStocks.getMaterialStocksOfCategory)

/**
 * Stock Movement Routes
 */
router
    .route('/inventory/stock-movements')
    .get(StockMovement.getStockMovements)
    .put(StockMovement.updateStockMovements)
    .delete(StockMovement.removeStockMovements)

router
    .route('/inventory/stock-movements/:categoryId')
    .get(StockMovement.getStockMovements)

router
    .route('/inventory/stock-movements/:branchId/l/:limitedTo')
    .get(StockMovement.getMovementsOfBranch)


/**
 * Stock Movement Reasons
 */
router
    .route('/inventory/stock-movement-reasons')
    .post(StockMovementReason.updateStockMovementReasons)
    .patch(StockMovementReason.removeStockMovementReasons)

router
    .route('/inventory/stock-movement-reasons/:branchId')
    .get(StockMovementReason.getStockMovementReasonsOfBranch)

/**
 * Stock Locations
 */
router
    .route('/inventory/stock-locations/:branchId')
    .get(StockLocation.getStockLocations)
    .post(StockLocation.updateStockLocation)

router
    .route('/inventory/stock-location/:locationId')
    .get(StockLocation.getStockLocation)
    .delete(StockLocation.removeStockLocation)

router
    .route('/deliverybrands')
    .get(DeliveryBrand.getAllDeliveryBrands)
    .put(DeliveryBrand.updateDeliveryBrand)
    .patch(DeliveryBrand.removeDeliverBrand)

router
    .route('/deliverybrand/:brandId')
    .get(DeliveryBrand.getDeliveryBrand)

router
    .route('/deliverybrands/:branchId')
    .get(DeliveryBrand.getAllDeliveryBrands)

module.exports = router;