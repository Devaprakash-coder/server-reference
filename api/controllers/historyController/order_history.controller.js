'use strict';

const orderHistory = require('../../models/history/omsModels/order_history.model');

exports.getOrderHistory = (req, res) => {
    let userId = req.userId;
    orderHistory.find({ 'order_list.item_details.customer_id' : userId }, (err, userOrder) => {
        res.status(200).json({
            status: 1,
            message: 'get order history working fine',
            orders: userOrder
        })
    });
}

/** @description : Get Completed Order based on Id */
exports.getCompletedOrderById = (req, res) => {	
	let orderId = req.params.orderId;
	orderHistory.findById(orderId, (err, order) => {
		if (err) {
			console.error({
				status: 0,
				message: 'error finding order',
				error: err
			});
			res.status(500).json({
				status: 0,
				message: 'error finding order',
				error: 'problem with the server'
			});
		} else if (order) {
			let modified_order_details = {
				order_status: order.order_status,
				order_discount: order.order_discount,
				order_list: order.order_list,
				_id: order._id,
				order_type: order.order_type,
				ordered_time: order.ordered_time,
				total_cost: order.total_cost,
				final_cost: order.final_cost,
				order_number: order.order_number,
				is_applied_service_charge: order.is_applied_service_charge,
				service_charge_percentage: order.service_charge_percentage, 
				service_charge_amount: order.service_charge_amount, 
				order_tax_details: order.order_tax_details, 
				item_discounts: order.item_discounts,  
				order_tax_amount: order.order_tax_amount, 
				total_cost_after_dicount: order.total_cost_after_dicount,
				total_after_incl_tax: order.total_after_incl_tax, 
				grand_total: order.grand_total			
			}
			res.status(200).json({
				status: 1,
				message: 'order obtained successfully',
				order: modified_order_details
			});
		} else {
			res.status(404).json({
				status: 1,
				message: 'error finding order',
				error: 'no order found'
			});
		}
	});
};

/**
 * @type new
 * @purpose getOrderHistoryOfBranch
 */
exports.getBranchOrderHistory = async (req, res) => {
    if(req.accessType == 'admin' || req.accessType == 'superadmin' || req.accessType === 'staffs') {
        let branchId;
        let limitCount = req.params.limitCount;
        branchId = req.body.branchId;

        try {
            let order_history = await orderHistory.find({ 'branch_id' : branchId }).sort({ ordered_time: -1 }).skip(limitCount > 0 ? (limitCount - 1) : 0).limit(2);
                res.status(200).json({
                    status: 1,
                    message: 'get order history working fine',
                    orders: order_history
                });
        } catch (err) {
                console.error({
                    status: 0,
                    message: 'error finding orders',
                    error: err
                });
                res.status(500).json({
                    status: 0,
                    message: 'error finding orders',
                    error: 'problem with the server'
                });
        } 


        // if(req.para)
        // orderHistory.find(query, (err, branchOrders) => {
        //     if(err) {
        //         console.error({
        //             status: 0,
        //             message: 'error finding orders',
        //             error: err
        //         });
        //         res.status(500).json({
        //             status: 0,
        //             message: 'error finding orders',
        //             error: 'problem with the server'
        //         });
        //     }else{
        //         res.status(200).json({
        //             status: 1,
        //             message: 'get order history working fine',
        //             orders: branchOrders
        //         });
        //     }
        // });
    }else{
        console.error({
            status: 0,
            message: 'error getting order details',
            error: 'invalid access'
        });
        res.status(401).json({
            status: 0,
            message: 'error getting order details',
            error: 'invalid access'
        })
    }
   
}

exports.getHistoryUserOrderHistory = (req, res) => {
    if(req.accessType === 'guest') {
        let userId = req.userId;
        orderHistory.find({ 'order_list.item_details.customer_id' : userId }, (err, userOrder) => {
            res.status(200).json({
                status: 1,
                message: 'get order history working fine',
                orders: userOrder
            })
        });
    }else{		
        res.status(401).json({
            status: 1,
            message: 'invalid access'
        })
    }
}