'use strict';

/* 
* Dependency Modules 
*/
const Table = require('../models/omsModels/table.model');
const Branch = require('../models/branch.model');
const Company = require('../models/company.model');
const Item = require('../models/managementModels/menu_item.model');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const Categories = require('../models/managementModels/menu_category.model');

/**
 * Scanned Login User Actions (Depricated (Since these API Actions are handled in Dinamic Itself))
 */
exports.ScanLogin = (req, res) => {
    let code = req.body.code;
    let id = req.body.id;
    let customerId = req.body.customer_id;

    if (id === 'd') {
        {
            Table.findOneAndUpdate({ access_code: code, dinamic_status: 'active' }, { $inc: { 'qr_count': 1 } }, (err, table) => {
                if (err) {
                    console.error({
                        status: 0,
                        message: 'Error Occured while logging in with QR Code',
                        error: err
                    })
                    res.status(500).json({
                        status: 0,
                        message: "Error Occured while logging in with QR Code",
                        error: "Problem with server"
                    });
                }
                else if (!table) {
                    res.status(404).json({
                        status: 0,
                        message: "No Table Found",
                        error: "No table associated with the passed parameter"
                    });
                } else {
                    let branch_id = table.branch_id;
                    Branch.aggregate(
                        [
                            { $match: { _id: mongoose.Types.ObjectId(branch_id) } },
                            { $addFields: { "branch_id": { "$toString": "$_id" } } },
                            {
                                $lookup: {
                                    from: 'menu_categories',
                                    localField: 'branch_id',
                                    foreignField: 'branch_id',
                                    as: 'categories_list'
                                }
                            },
                            { $project: { "branch_id": 0, "categories_list.branch_id": 0 } }
                        ],
                        (err, branch_details) => {
                            if (err) {
                                console.error({
                                    status: 0,
                                    message: 'Error getting branch details',
                                    error: err
                                });
                                res.status(500).json({
                                    status: 0,
                                    message: "Error getting branch details",
                                    error: "Problem with server"
                                });
                            }
                            else {
                                if (customerId) {
                                    let payload = {
                                        userId: customerId,
                                        companyId: branch_details[0].company_id,
                                        branchId: branch_id,
                                        accessType: 'guest'
                                    };
                                    let token = jwt.sign(payload, "thisissparta");
                                    res.status(200).json({
                                        status: 1,
                                        message: "User Authenticated",
                                        branch_details: branch_details,
                                        table_detail: table,
                                        token: token
                                    });
                                } else {
                                    res.status(200).json({
                                        status: 1,
                                        message: "Data Obtained Successfully",
                                        branch_details: branch_details,
                                        table_detail: table
                                    });
                                }
                            }
                        }
                    )
                }
            })
        }
    } else if (id === 'n') {
        Table.findOneAndUpdate({ access_code: code, dinamic_status: 'active' }, { $inc: { 'nfc_count': 1 } }, (err, table) => {
            if (err) {
                console.error({
                    status: 0,
                    message: 'Error Occured while logging in with NFC Code',
                    error: err
                });

                res.status(500).json({
                    status: 0,
                    message: "Error Occured while logging in with NFC Code",
                    error: "Problem with server"
                });
            }
            if (!table) {
                res.status(404).json({
                    status: 0,
                    message: 'No table found',
                    error: 'No table associated with the passed parameter'
                });
            } else {
                let branch_id = table.branch_id;
                Branch.aggregate(
                    [
                        { $match: { _id: mongoose.Types.ObjectId(branch_id) } },
                        { $addFields: { "branch_id": { "$toString": "$_id" } } },
                        {
                            $lookup: {
                                from: 'menu_categories',
                                localField: 'branch_id',
                                foreignField: 'branch_id',
                                as: 'categories_list'
                            }
                        },
                        { $project: { "branch_id": 0, "categories_list.branch_id": 0 } }
                    ],
                    (err, branch_details) => {
                        if (err) {
                            console.error({
                                status: 0,
                                message: 'Error while getting branch details',
                                error: err
                            });

                            res.status(500).json({
                                status: 0,
                                message: "Error while getting branch details",
                                error: "Problem with server"
                            });
                        }
                        else {
                            if (customerId) {
                                let payload = {
                                    userId: customerId,
                                    companyId: branch_details.company_id,
                                    branchId: branch_id,
                                    accessType: 'guest'
                                };
                                let token = jwt.sign(payload, "thisissparta");
                                res.status(200).json({
                                    status: 1,
                                    message: "User Authenticated",
                                    token: token,
                                    branch_details: branch_details,
                                    table_detail: table
                                });
                            } else {
                                res.status(200).json({
                                    status: 1,
                                    message: "Data Obtained Successfully",
                                    branch_details: branch_details,
                                    table_detail: table
                                });
                            }
                        }
                    }
                )
            }
        })
    } else if (id === 't') {
        Table.findOne({ _id: code, table_status: 'active' }, (err, table) => {
            if (err) {
                console.error({
                    status: 0,
                    message: 'Error Occured while logging in with Table Code',
                    error: err
                });
                res.status(500).json({
                    status: 0,
                    message: "Error Occured while logging in with Table Code",
                    error: "Problem with server"
                });
            }
            if (!table) {
                res.status(404).json({
                    status: 0,
                    message: 'No table found',
                    error: 'No table associated with the passed parameter'
                });
            } else {
                let branch_id = table.branch_id;
                Branch.aggregate(
                    [
                        { $match: { _id: mongoose.Types.ObjectId(branch_id) } },
                        { $addFields: { "branch_id": { "$toString": "$_id" } } },
                        {
                            $lookup: {
                                from: 'menu_categories',
                                localField: 'branch_id',
                                foreignField: 'branch_id',
                                as: 'categories_list'
                            }
                        },
                        { $project: { "branch_id": 0, "categories_list.branch_id": 0 } }
                    ],
                    (err, branch_details) => {
                        if (err) {
                            console.error({
                                status: 0,
                                message: 'Error while getting branch details',
                                error: err
                            });
                            res.status(500).json({
                                status: 0,
                                message: "Error while getting branch details",
                                error: "Problem with server"
                            });
                        } else {
                            if (customerId) {
                                let payload = {
                                    userId: customerId,
                                    companyId: branch_details.company_id,
                                    branchId: branch_id,
                                    accessType: 'guest'
                                };
                                let token = jwt.sign(payload, "thisissparta");
                                res.status(200).json({
                                    status: 1,
                                    message: "User Authnticated",
                                    token: token,
                                    branch_details: branch_details,
                                    table_detail: table
                                });
                            } else {
                                res.status(200).json({
                                    status: 1,
                                    message: "Table details Obtained Successfully",
                                    branch_details: branch_details,
                                    table_detail: table
                                });
                            }
                        }
                    }
                )
            }
        })
    } else {
        res.status(500).json({
            status: 0,
            message: 'No Data Found',
            error: 'Invalid parameters'
        });
    }
}

/**
 * Updated Scanned Login
 *  * NOTE: Used on table branch details
 */
exports.getTableDetails = (req, res) => {
    let id = req.params.tableId;
    let customerId = req.body.customer_id;
    let customerName = req.body.name;

    Table.findOne({ _id: id, table_status: 'active' }, (err, table) => {
        if (err) {
            console.error({
                status: 0,
                message: 'Error Occured while logging in with Table Code',
                error: err
            });
            res.status(500).json({
                status: 0,
                message: "Error Occured while logging in with Table Code",
                error: "Problem with server"
            });
        }else if (!table) {
            res.status(404).json({
                status: 0,
                message: 'No table found',
                error: 'No table associated with the passed parameter'
            });
        } else {
            let branch_id = table.branch_id;
            Branch.aggregate(
                [
                    { $match: { _id: mongoose.Types.ObjectId(branch_id) } },
                    { $addFields: { "branch_id": { "$toString": "$_id" } } },
                    {
                        $lookup: {
                            from: 'menu_categories',
                            localField: 'branch_id',
                            foreignField: 'branch_id',
                            as: 'categories_list'
                        }
                    },
                    { $project: { "branch_id": 0, "categories_list.branch_id": 0 } }
                ],
                (err, branch_details) => {
                    if (err) {
                        console.error({
                            status: 0,
                            message: 'Error while getting branch details',
                            error: err
                        });
                        res.status(500).json({
                            status: 0,
                            message: "Error while getting branch details",
                            error: "Problem with server"
                        });
                    } else {
                        Company.findOne({ _id: branch_details[0].company_id }, (err, CompanyResult) => {
                            if (err) {
                                console.error({
                                    status: 0,
                                    message: 'Error while getting branch details',
                                    error: err
                                });
                                res.status(500).json({
                                    status: 0,
                                    message: "Error while getting branch details",
                                    error: "Problem with server"
                                });
                            } else if (CompanyResult) {
                                if (CompanyResult.logo_url) {
                                    branch_details[0].logo_url = CompanyResult.logo_url;
                                }
                                if (CompanyResult.service_charge) {
                                    branch_details[0].service_charge = CompanyResult.service_charge;
                                    branch_details[0].customer_editable_sc = CompanyResult.customer_editable_sc;
                                }
                                if (branch_details[0].categories_list && branch_details[0].categories_list.length) {
                                    branch_details[0].total_items_count = 0;
                                    // branch_details[0].categories_list[0].categories.forEach((category) => {
                                    //     if (category.item_count) {
                                    //         branch_details[0].total_items_count += category.item_count
                                    //     }
                                    // })
                                    let active_categories = branch_details[0].categories_list[0].categories.filter((cat) => cat.status === 'active')
                                    active_categories.forEach((category) => {
                                        if (category.item_count) {
                                            branch_details[0].total_items_count += category.item_count
                                        }
                                    })
                                    branch_details[0].categories_list[0].categories = active_categories.sort((a, b) => parseFloat(a.rank) - parseFloat(b.rank))
                                } else {
                                    branch_details[0].total_items_count = 0;
                                }
                                if (customerId) {
                                    let payload = {
                                        userId: customerId
                                        , userName: customerName
                                        , companyId: branch_details.company_id
                                        , branchId: branch_id
                                        , tableId: id
                                        , accessType: 'guest'
                                    };
                                    let token = jwt.sign(payload, "thisissparta");
                                    res.status(200).json({
                                        status: 1,
                                        message: "User Authnticated",
                                        token: token,
                                        branch_details: branch_details,
                                        table_detail: table
                                    });
                                } else {
                                    res.status(200).json({
                                        status: 1,
                                        message: "Table details Obtained Successfully",
                                        branch_details: branch_details,
                                        table_detail: table
                                    });
                                }
                            } else {
                                console.error({
                                    status: 0,
                                    message: 'Error while getting branch details',
                                    error: 'Invalid Parameters'
                                });
                                res.status(404).json({
                                    status: 0,
                                    message: "No Comany Found with the associated Details",
                                    error: "Invalid Parameters"
                                });
                            }
                        })
                    }
                }
            )
        }
    })
}

/**
 * (getting directly from ItemController)
 * Items Based on Category Id //TODO: can remove and get directly fom item controller
 * NOTE: Used on takeaway branch details
 */
exports.getItemsOfBranch = (req, res) => {
    let branch_id = req.params.branchId;
    let customerId = req.body.customer_id;
    let customerName = req.body.name;

    if ((branch_id == '5d762e94616811098ce45603') || (branch_id == '5d7b1f872b901f4d95cdbb99') || (branch_id == '5d8466fb35c2c7195f66e518')) {
        let new_query;
        if (branch_id == '5d762e94616811098ce45603') {
            new_query = ['5d762e94616811098ce45603', '5d8466fb35c2c7195f66e518', '5d7b1f862b901f4d95cdbb7a']
        } else if (branch_id == '5d8466fb35c2c7195f66e518') {
            new_query = ['5d8466fb35c2c7195f66e518', '5d762e94616811098ce45603', '5d7b1f862b901f4d95cdbb7a']
        } else if (branch_id == '5d7b1f872b901f4d95cdbb99') {
            new_query = ['5d7b1f872b901f4d95cdbb99', '5d8466fb35c2c7195f66e518']
        }

        Branch.aggregate(
            [
                { $match: { _id: mongoose.Types.ObjectId(branch_id) } },
                { $addFields: { "branch_id": { "$toString": "$_id" } } },
                { $project: { "branch_id": 0, "categories_list.branch_id": 0 } }
            ],
            (err, branch_details) => {
                if (err) {
                    console.error({
                        status: 0,
                        message: 'Error while getting branch details',
                        error: err
                    });
                    res.status(500).json({
                        status: 0,
                        message: "Error while getting branch details",
                        error: "Problem with server"
                    });
                } else {
                    Company.findOne({ _id: branch_details[0].company_id }, (err, CompanyResult) => {
                        if (err) {
                            console.error({
                                status: 0,
                                message: 'Error while getting branch details',
                                error: err
                            });
                            res.status(500).json({
                                status: 0,
                                message: "Error while getting branch details",
                                error: "Problem with server"
                            });
                        } else if (CompanyResult) {
                            if (CompanyResult.logo_url) {
                                branch_details[0].logo_url = CompanyResult.logo_url;
                            }
                            // if(branch_details[0].categories_list && branch_details[0].categories_list.length) {
                            //     branch_details[0].total_items_count = 0;
                            //     branch_details[0].categories_list[0].categories.forEach((category) => {
                            //         if(category.item_count) {
                            //             branch_details[0].total_items_count += category.item_count
                            //         }
                            //     })
                            // }else{
                            //     branch_details[0].total_items_count = 0;
                            // }
                            if (customerId) {
                                let payload = {
                                    userId: customerId
                                    , userName: customerName
                                    , companyId: branch_details[0].company_id
                                    , branchId: branch_id
                                    // , orderId: id
                                    , accessType: 'guest'
                                };
                                let token = jwt.sign(payload, "thisissparta");

                                Categories.aggregate([
                                    { $match: { branch_id: { $in: new_query } } },
                                    // {
                                    //     $project: {
                                    //      categories: {
                                    //         $filter: {
                                    //           input: "$categories",
                                    //           as: "item",
                                    //          cond: { $eq: [ "$$item.status", "active" ] }
                                    //         }
                                    //      }
                                    //   }
                                    // }
                                ], async (err, result) => {
                                    if (err) {
                                        // throw err
                                        res.status(500).json({
                                            status: 0,
                                            message: 'error finding categories',
                                            error: 'problem with the server'
                                        });
                                    } else {
                                        let temp_array = [];
                                        await asyncForEach(result, async (list) => {
                                            let filteredList = list.categories.filter((category) => category.status == 'active');
                                            await asyncForEach(filteredList, async (category, i) => {
                                                category.branch_id = list.branch_id;
                                            });
                                            temp_array.push(list.categories);
                                        });

                                        async function asyncForEach(array, callback) {
                                            for (let index = 0; index < array.length; index++) {
                                                await callback(array[index], index, array);
                                            }
                                        }

                                        const flatten = arr => arr.reduce((acc, next) => acc.concat(Array.isArray(next) ? flatten(next) : next), [])
                                        let updated_category_list = result[0];
                                        updated_category_list.categories = await flatten(temp_array);

                                        branch_details[0].categories_list = [];
                                        branch_details[0].categories_list[0] = updated_category_list;

                                        if (updated_category_list && updated_category_list.length) {
                                            branch_details[0].total_items_count = 0;
                                            updated_category_list.categories.forEach((category) => {
                                                if (category.item_count) {
                                                    branch_details[0].total_items_count += category.item_count
                                                }
                                            })
                                        } else {
                                            branch_details[0].total_items_count = 0;
                                        }


                                        res.status(200).json({
                                            status: 1,
                                            message: "User Authnticated",
                                            token: token,
                                            branch_details: branch_details,
                                        });
                                    }
                                })
                            } else {
                                Categories.aggregate([
                                    { $match: { branch_id: { $in: new_query } } },
                                    // {
                                    //     $project: {
                                    //      categories: {
                                    //         $filter: {
                                    //           input: "$categories",
                                    //           as: "item",
                                    //          cond: { $eq: [ "$$item.status", "active" ] }
                                    //         }
                                    //      }
                                    //   }
                                    // }
                                ], async (err, result) => {
                                    if (err) {
                                        // throw err
                                        res.status(500).json({
                                            status: 0,
                                            message: 'error finding categories',
                                            error: 'problem with the server'
                                        });
                                    } else {
                                        let temp_array = [];
                                        await asyncForEach(result, async (list) => {
                                            let filteredList = list.categories.filter((category) => category.status == 'active');
                                            await asyncForEach(filteredList, async (category, i) => {
                                                category.branch_id = list.branch_id;
                                            });
                                            temp_array.push(list.categories);
                                        });

                                        async function asyncForEach(array, callback) {
                                            for (let index = 0; index < array.length; index++) {
                                                await callback(array[index], index, array);
                                            }
                                        }

                                        const flatten = arr => arr.reduce((acc, next) => acc.concat(Array.isArray(next) ? flatten(next) : next), [])
                                        let updated_category_list = result[0];
                                        updated_category_list.categories = await flatten(temp_array);

                                        branch_details[0].categories_list = [];
                                        branch_details[0].categories_list[0] = updated_category_list;

                                        if (updated_category_list) {
                                            branch_details[0].total_items_count = 0;
                                            updated_category_list.categories.forEach((category) => {
                                                if (category.item_count) {
                                                    branch_details[0].total_items_count += category.item_count
                                                }
                                            })
                                        } else {
                                            branch_details[0].total_items_count = 0;
                                        }
                                        res.status(200).json({
                                            status: 1,
                                            message: "Branch details Obtained Successfully",
                                            branch_details: branch_details,
                                        });
                                    }
                                })
                            }
                        } else {
                            console.error({
                                status: 0,
                                message: 'Error while getting branch details',
                                error: 'Invalid Parameters'
                            });
                            res.status(404).json({
                                status: 0,
                                message: "No Comany Found with the associated Details",
                                error: "Invalid Parameters"
                            });
                        }
                    })

                }
            })
    } else {
        Branch.aggregate(
            [
                { $match: { _id: mongoose.Types.ObjectId(branch_id) } },
                { $addFields: { "branch_id": { "$toString": "$_id" } } },
                {
                    $lookup: {
                        from: 'menu_categories',
                        localField: 'branch_id',
                        foreignField: 'branch_id',
                        as: 'categories_list'
                    }
                },
                // { $project: {
                //     "categories_list": 1,
                // 	"company_id" : 1,
                // 	"name" : 1,
                // 	"location" : 1,
                // 	"opening_hours" : 1,
                // 	"table_plans" :1,
                // 	"quick_options" :1,
                // 	"setting" : 1,
                // 	"linked_branches" :1,
                // 	"counters" : 1,
                // 	"taxes" : 1,
                // 	"tax_value" : 1,
                // 	"branch_id" : 1,
                // 	"categories": { $arrayElemAt: [ "$categories_list.categories", 0 ] }
                // } }, 
                // { $project: {
                // 	"company_id" : 1,
                // 	"name" : 1,
                // 	"location" : 1,
                // 	"opening_hours" : 1,
                // 	"table_plans" :1,
                // 	"quick_options" :1,
                // 	"setting" : 1,
                // 	"linked_branches" :1,
                // 	"counters" : 1,
                // 	"taxes" : 1,
                // 	"tax_value" : 1,
                // 	"branch_id" : 1,
                // 	"categories_list.categories": "$categories",
                // }
                // }
            ],
            (err, branch_details) => {
                if (err) {
                    console.error({
                        status: 0,
                        message: 'Error while getting branch details',
                        error: err
                    });
                    res.status(500).json({
                        status: 0,
                        message: "Error while getting branch details",
                        error: "Problem with server"
                    });
                } else {
                    Company.findOne({ _id: branch_details[0].company_id }, (err, CompanyResult) => {
                        if (err) {
                            console.error({
                                status: 0,
                                message: 'Error while getting branch details',
                                error: err
                            });
                            res.status(500).json({
                                status: 0,
                                message: "Error while getting branch details",
                                error: "Problem with server"
                            });
                        } else if (CompanyResult) {
                            if (CompanyResult.logo_url) {
                                branch_details[0].logo_url = CompanyResult.logo_url;
                            }
                            if (branch_details[0].categories_list && branch_details[0].categories_list.length) {
                                branch_details[0].total_items_count = 0;
                                branch_details[0].categories_list[0].categories.forEach((category) => {
                                    if (category.item_count) {
                                        branch_details[0].total_items_count += category.item_count
                                    }
                                })
                                branch_details[0].categories_list[0].categories = branch_details[0].categories_list[0].categories.sort((a, b) => parseFloat(a.rank) - parseFloat(b.rank))
                            } else {
                                branch_details[0].total_items_count = 0;
                            }
                            if (customerId) {
                                let payload = {
                                    userId: customerId
                                    , userName: customerName
                                    , companyId: branch_details[0].company_id
                                    , branchId: branch_id
                                    // , orderId: id
                                    , accessType: 'guest'
                                };
                                let token = jwt.sign(payload, "thisissparta");
                                res.status(200).json({
                                    status: 1,
                                    message: "User Authnticated",
                                    token: token,
                                    branch_details: branch_details,
                                });
                            } else {
                                res.status(200).json({
                                    status: 1,
                                    message: "Branch details Obtained Successfully",
                                    branch_details: branch_details,
                                });
                            }
                        } else {
                            console.error({
                                status: 0,
                                message: 'Error while getting branch details',
                                error: 'Invalid Parameters'
                            });
                            res.status(404).json({
                                status: 0,
                                message: "No Comany Found with the associated Details",
                                error: "Invalid Parameters"
                            });
                        }
                    })

                }
            }
        )
    }
}

/**
 * Dummy Api For getting item details
 */
exports.getStaticItemsOfBranch = (req, res) => {
    let branch_id = '5befbfac2b814422a23360ab';
    let customerId = '5d0275edb144705a0cb860b3';
    let customerName = 'Dummy User';

    let category_id = "5c8b449f5d49d102b33aac4c";
    let requestedDay = 'sunday'; // This will be restricted later for admin
    /**
     * Note : Check For dayName to filter out items 
     * available on a  particular day
     */
    // NOTE: Used the square bracket to use variable in a mongo query
    Item.aggregate([
        {
            $match: {
                'category_id': category_id,
                'item_status': { $ne: 'removed' },
                'available_days.day': requestedDay,
                'available_days.status': true
            }
        },
        {
            $project: {
                available_days: {
                    $filter: {
                        input: "$available_days",
                        as: "days",
                        cond: { $eq: ["$$days.status", true] }
                    }
                },
                _id: 1,
                imageUrl: 1,
                tags: 1,
                item_status: 1,
                branch_id: 1,
                category_id: 1,
                name: 1,
                skucode:1,
                selling_price: 1,
                food_type: 1,
                kot_order: 1,
                combo_menu: 1,
                item_external_status:1,
                addons: 1,
                item_description: 1
            }
        },
    ],
        (err, item_list) => {
            if (err) {
                console.error({
                    status: 0,
                    message: "Error finding Item on that particular day",
                    error: err
                });
                res.status(500).json({
                    status: 0,
                    message: "Error finding Item on that particular day",
                    error: "Problem with server"
                });
            } else if (!item_list.length) {
                res.status(200).json({
                    status: 0,
                    message: "No items found on a particular day",
                    error: "No items asscoiated with the passed day parameter"
                });
            } else {
                let d = new Date();
                let year = d.getFullYear();
                let month = d.getMonth();
                let day = d.getDate();
                // let hour = d.getHours();
                // let minute = d.getMinutes();
                // let second = d.getSeconds();
                let current_time = d.getTime();

                let modified_list = item_list.map(item => {
                    let nextAvailability;
                    item.available_days.filter((availableDays, i) => {
                        if (availableDays.day == requestedDay) {
                            if (i === (item.available_days.length - 1)) {
                                nextAvailability = item.available_days[0];
                            } else {
                                nextAvailability = item.available_days[i + 1];
                            }
                            return availableDays;
                        }
                    }).map(days => {
                        days.sessions.forEach((session, i) => {
                            if (session.from_time) {
                                let from_time = session.from_time.split(':');
                                let to_time = session.to_time.split(':');
                                let moded_from_time = new Date(year, month, day, from_time[0], from_time[1], 0, 0).getTime();
                                let moded_to_time = new Date(year, month, day, to_time[0], to_time[1], 0, 0).getTime();

                                if (current_time > moded_from_time && current_time < moded_to_time && (i === (days.sessions.length - 1))) {
                                    // item.next_availability = "now";
                                    item.next_availability = `${requestedDay} ${session.from_time}`
                                } else if (i === (days.sessions.length - 1)) {
                                    item.item_status = item.item_status === 'hidden' ? item.item_status : 'unavailable';
                                    item.next_availability = `${nextAvailability.day} ${nextAvailability.sessions[0].from_time}`
                                }
                            }
                        })
                    })
                    return item;
                });

                res.status(200).json({
                    status: 1,
                    message: "Data Obtained Successfully",
                    item_list: modified_list
                });
            }
        }
    );
}


/**
 *
 * Backup
 */
// Branch.aggregate(
//     [ 
//         { $match: { _id : mongoose.Types.ObjectId(branch_id)  }},
//         { $addFields: { "branch_id": { "$toString": "$_id" }}},
//         { $lookup: {
//                 from : 'menu_categories',
//                 localField: 'branch_id', 
//                 foreignField: 'branch_id',
//                 as: 'categories_list'
//             }
//         },
//         { $project: { "branch_id" : 0, "categories_list.branch_id" : 0 }}
//     ],
//     (err, branch_details) => {
//         if (err) { 
//             console.error({ 
//                 status: 0, 
//                 message: 'Error while getting branch details', 
//                 error: err 
//             });
//             res.status(500).json({ 
//                 status : 0, 
//                 message: "Error while getting branch details",
//                 error: "Problem with server"
//             }); 
//         } else {
//             Company.findOne({ _id: branch_details[0].company_id }, (err, CompanyResult) => {
//                 if(err) {
//                     console.error({ 
//                         status: 0, 
//                         message: 'Error while getting branch details', 
//                         error: err 
//                     });
//                     res.status(500).json({ 
//                         status : 0, 
//                         message: "Error while getting branch details",
//                         error: "Problem with server"
//                     }); 
//                 }else if(CompanyResult) {
//                     if(CompanyResult.logo_url) {
//                         branch_details[0].logo_url = CompanyResult.logo_url;
//                     }
//                     if(branch_details[0].categories_list && branch_details[0].categories_list.length) {
//                         branch_details[0].total_items_count = 0;
//                         branch_details[0].categories_list[0].categories.forEach((category) => {
//                             if(category.item_count) {
//                                 branch_details[0].total_items_count += category.item_count
//                             }
//                         })
//                     }else{
//                         branch_details[0].total_items_count = 0;
//                     }
//                     if(customerId) {
//                         let payload = { 
//                             userId: customerId
//                             , userName: customerName
//                             , companyId: branch_details[0].company_id
//                             , branchId : branch_id
//                             // , orderId: id
//                             , accessType : 'guest' 
//                         };
//                         let token = jwt.sign(payload, "thisissparta");
//                         res.status(200).json({ 
//                             status: 1, 
//                             message: "User Authnticated", 
//                             token: token, 
//                             branch_details: branch_details, 
//                         });
//                     }else{
//                         res.status(200).json({ 
//                             status: 1, 
//                             message: "Branch details Obtained Successfully" , 
//                             branch_details: branch_details, 
//                         });
//                     }
//                 }else{
//                     console.error({ 
//                         status: 0, 
//                         message: 'Error while getting branch details', 
//                         error: 'Invalid Parameters' 
//                     });
//                     res.status(404).json({ 
//                         status : 0, 
//                         message: "No Comany Found with the associated Details",
//                         error: "Invalid Parameters"
//                     }); 
//                 }
//             })

//         }
//     }
// )