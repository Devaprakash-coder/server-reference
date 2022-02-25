'use strict';

const HistoryBills = require('./../../models/history/omsModels/bill_history.model');
const HistoryOrders = require('./../../models/history/omsModels/order_history.model');

exports.getBillHistory = async (req, res) => {
    if (req.accessType === "superadmin" || req.accessType === "admin" || req.accessType === 'staffs') {
        console.log('body',req.body.tables);
        
        let branchId = req.params.branchId;
        let fromDate = new Date(Number(req.params.fromDate));
        let toDate = new Date(Number(req.params.toDate));
        let floor = req.body.floors ? req.body.floors : 'all';
        let table = req.body.tables ? req.body.tables : 'all';
        let filterByTable = req.body.tables_only ? req.body.tables_only : false;
       
        // let fyear = fromDate.getFullYear();
        // let fmonth = ("0" + (fromDate.getMonth() + 1)).slice(-2);
        // let fday = ("0" + toDate.getDate()).slice(-2);
        // let from_date = fyear + "-" + fmonth +"-" + fday + "T00:00:00.000+00:00"
        // let tyear = toDate.getFullYear();
        // let tmonth = ("0" + (toDate.getMonth() + 1)).slice(-2);
        // let tday = ("0" + toDate.getDate()).slice(-2);
        // let to_date = tyear + "-" + tmonth +"-" + tday + "T23:59:59.999+00:00"
        try{
            let query;
            let populateTableQuery;
            
            if(floor === 'all') {
                query = { 
                    branch_id: branchId, 
                    searchdate: {
                        $gte: new Date(fromDate),
                        $lte:  new Date(toDate)
                    } 
                }
                // populateTableQuery = { 
                //     path: 'table_id', 
                //     select: {  'name' : 1, 'floor_name': 1, 'floor_id': 1, 'members': 1 },
                //     populate: {
                //         path: 'members',
                //         select: 'visits name email contact_number'
                //     }   
                // }
            } else if(floor !='all' && table == 'all') {
                let floorArray;
                floorArray = floor.split(',')
                query = {
                    branch_id: branchId, 
                    searchdate: {
                        $gte: new Date(fromDate),
                        $lte:  new Date(toDate)
                    } 
                }
                if (floor && table=="all") {
                    
            }
                
                // populateTableQuery = { 
                //     path: 'table_id', 
                //     match: { 
                //         'floor_id': { $in: floorArray } 
                //     }, 
                //     select: {  'name' : 1, 'floor_name': 1, 'floor_id': 1, 'members': 1 },
                //     populate: {
                //         path: 'members',
                //         select: 'visits name email contact_number'
                //     }
                // }

            } else if(floor !== 'all' && table != 'all') {
                let floorArray;
                let tableArray;

                // floorArray = floor.split(',')
                // tableArray = table.split(',')

                query = {
                    branch_id: branchId, 
                    searchdate: {
                        $gte: new Date(fromDate),
                        $lte:  new Date(toDate)
                    }
                }
                // populateTableQuery = { 
                //     path: 'table_id', 
                //     options: {
                //         retainNullValues: true 
                //     }, 
                //     match: { 
                //         $and: [{ 
                //             'floor_id': { $in: floorArray }, 
                //             '_id': { $in: tableArray } 
                //         }] 
                //     }, 
                //     select: {  'name' : 1, 'floor_name': 1, 'floor_id': 1, 'members': 1 },
                //     populate: {
                //         path: 'members',
                //         select: 'visits name email contact_number'
                //     }
                // }
            }
            let timezone = req.params.timezonect+"/"+ req.params.timezonearea;
            let orderHistory = await HistoryOrders.aggregate([
                {
                    
                    $addFields: {
                        searchdate: {
                            $toDate:{
                            $dateToString: {
                                date: '$ordered_time',
                                timezone: timezone
                            }
                        }
                         }
                        }
                },
                { $match: query },
                { $sort: {searchdate: -1} },
                { 
                    $project: { 
                         order_number: 1, order_status: 1, order_type: 1,order_tax_amount:1, ordered_time:1,searchdate:1,
                        'order_list.kot_number':1, 'order_list.kot_confirmed_by':1, 
                        'order_list.item_details.name':1, 'order_list.item_details.quantity':1 ,
                        'order_list.item_details.sold_price':1, 'order_list.item_details.customer_name':1 ,
                        'order_list.ordered_at':1,
                        grand_total:1, order_id: 1, table_id: {"$toString": "$table_id"}, bill_id: 1 
                    }
                },
                {
                    $lookup:
                        {
                            from: 'history_tables',
                            "let": { "ordernumber": "$order_number", "tableid": "$table_id" },
                           
                            "pipeline": [
                               { "$match": { "$expr": { "$and":[ { "$eq": [ "$order_number", "$$ordernumber" ]},{"$eq": [ "$table_id", "$$tableid" ] }] } } }
                            ],
                               
                            as: 'table_details'
                        }
                        
                },
                { 
                    "$unwind": {
                        "path": "$table_details",
                        "preserveNullAndEmptyArrays": false
                    } 
                },   
                { 
                    "$addFields": {
                        "customer_ids": {
                            "$cond": {
                                "if": 
                                {
                                    "$ne": [ { "$type": "$table_details.members" }, "array" ]
                                },
                                "then": [],
                                "else": "$table_details.members"
                            }
                        }
                    }
                },
                {
                    $lookup:
                        {
                            from: 'customer_directories', 
                            "let": { "table_members": "$customer_ids" },
                            "pipeline": [
                               { "$match": { "$expr": { "$in": [ "$_id", "$$table_members" ] } } }
                            ],
                            "as": "customer_details"
                        }
                },
                // 'bill_type billed_at bill_count bills.paid_by bills.service_charge_amount bills.bill_final_cost bills.bill_taxes_details'
                {
                    $lookup:
                        {
                            from: 'history_bills',
                            localField: 'bill_id',
                            foreignField: '_id',
                            as: 'bill_details'
                        }
                },
                { 
                    "$unwind": {
                        "path": "$bill_details",
                        "preserveNullAndEmptyArrays": false
                    } 
                },
                { 
                    $project: { 
                        "customer_ids": 0,
                        "bill_details.bill_count": 0,
                        "bill_details.bill_type": 0,
                        "bill_details.biller_details": 0,
                        "bill_details.order_discount": 0,
                        "bill_details.order_offer": 0,
                        "bill_details.table_id": 0,
                        "table_details.has_alert": 0, 
                        "table_details.floor_id": 0, 
                        "table_details.branch_id": 0, 
                        "table_details.company_id": 0, 
                        "table_details.session_status": 0, 
                        "table_details.table_status": 0, 
                        "table_details.table_prefix": 0, 
                        "table_details.table_id": 0, 
                        "table_details.order_number": 0, 
                        "table_details.parent_table": 0, 
                        "table_details.child_of": 0, 
                        "table_details.members": 0, 
                        "table_details.child_table": 0, 
                        "table_details.parent_of": 0, 
                        "customer_details.addresses": 0,
                        "customer_details.branch_id": 0,
                        "customer_details.company_id": 0,
                        "customer_details.contact_number_verfied": 0,
                        "customer_details.created_at": 0,
                        "customer_details.customer_type": 0,
                        "customer_details.device_token": 0,
                        "customer_details.device_type": 0,
                        "customer_details.email_verified": 0,
                        "customer_details.registered": 0,
                        "customer_details.registered_by": 0,
                        "customer_details.reward_points": 0,
                        "customer_details.social_unique_id": 0,
                        "customer_details.status": 0
                    }
                },
                {
                    $lookup:
                        {
                            from: 'members_directory',
                            localField: 'order_list.kot_confirmed_by',
                            foreignField: '_id',
                            as: 'staff_details'
                        }
                },
                { 
                    $project: { 
                        "staff_details.company_id": 0,
                        "staff_details.created_at": 0,
                        "staff_details.pin": 0,
                        "staff_details.push_tokens": 0,
                        "staff_details.status": 0,
                        "staff_details.tour_status": 0,
                        "staff_details.__v": 0
                    }
                }
            ]);
           // console.log(orderHistory);
            let ModedResult;
            if(filterByTable && filterByTable === 'true')  {
                ModedResult = await orderHistory.filter((x) => x.table_id)
            } else {
                ModedResult = orderHistory
            }

            res.status(200).json({
                status: 1,
                message: "bills obtained successfully",
                data: ModedResult
            });
        }catch(err) {
            console.error({
                status: 0,
                message: 'error Getting bills',
                error: err
            })
            res.status(500).json({
                status: 0,
                message: "Error Getting bills",
                error: err
            });
        }
    }else{
        res.status(401).json({
            status: 0,
            message: "Error Getting bills, invalid access",
            error: "Access Denied"
        });
    }

}