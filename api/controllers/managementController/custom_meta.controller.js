"use strict";
const CustomerMeta = require("../../models/managementModels/customer_meta.model");
const Member = require('../../models/managementModels/member_directory.model')

/**
 * Customer Meta details Of a branch
 */

/**
 * Action : Get All the available customer types of a branch
 * @param branchId
 */
exports.getCustomerTypes = (req, res) => {
    let query_value = '';
    if (req.accessType === "superadmin" || req.accessType === "admin" || req.accessType === "staffs") {
        query_value = req.params.branchId;
    } else {
        console.error({ 
            status: 0,
            message: 'UnAuthorized Access',
            error: err
        });
        res.status(404).send({ 
            status: 0,
            message: 'UnAuthorized Access',
            error: "Access Denied"
        });
    }
    CustomerMeta.aggregate(
        [
            { $match: { branch_id: query_value } },
            {
                $addFields: {
                    customer_types: {
                        $filter: {
                            input: "$customer_types",
                            as: "customer_type",
                            cond: { $eq: ["$$customer_type.status", "active"] }
                        }
                    }
                }
            },
            { $project: { member_positions: 0, status: 0 } }
        ],
        (err, customerTypes) => {
            if (err) {
                console.error({
                    status: 0,
                    message: 'Error Getting Customer Types',
                    error: err
                });
                res.status(500).send({
                    status: 0,
                    message: 'Error Getting Customer Types',
                    error: "Problem with the server"
                });
            }else if(customerTypes.length){
                res.status(200).json({
                    status: 1,
                    customer_types: customerTypes[0].customer_types,
                    message: "Customer Type Obtained Successfully"
                });
            }else{
                res.status(200).json({
                    status: 1,
                    customer_types: [],
                    message: "No Customer Types Found"
                });
            }
           
        }
    );
};

/**
 * Action: Get Add & Update Customer Type
 * Add If the Customer Not Exists
 */
exports.updateCustomerType = (req, res) => {
    let query_value = '';
    let updateData = req.body.type_details;
    if (req.accessType === "superadmin" || req.accessType === "admin" || req.accessType === "staffs") {
        query_value = updateData.branch_id;
    } else {
        console.error({
            status: 0,
            message: 'UnAuthorized Access',
            error: err 
        })
        res.status(401).send({
            status: 0,
            message: 'UnAuthorized Access',
            error: 'Access denied' 
        });
    }
    if (!updateData._id) {
        CustomerMeta.update(
            { branch_id: query_value },
            {
                $push: { customer_types: updateData }
            },
            { new: true, upsert: true },
            function (err, result) {
                if (err) {
                    console.error({
                        status: 0,
                        message: 'Error Adding New Customer Type',
                        error: err 
                    })
                    res.status(500).send({
                        status: 0,
                        message: 'Error Adding New Customer Type',
                        error: 'Problem with the server' 
                    });
                }
                res.status(200).json({
                    status: 1,
                    message: "Customer Type Added Successfully",
                    customer: result
                });
            }
        );
    } else if (updateData._id) {
        CustomerMeta.update(
            { "customer_types._id": updateData._id },
            {
                $set: { "customer_types.$": updateData }
            },
            function (err, result) {
                if (err) {
                    console.error({
                        status: 0,
                        message: "Error updating customer type", 
                        error: err
                    });
                    res.status(500).send({
                        status: 0,
                        message: "Error updating customer type", 
                        error: 'Problem with the server'
                    });

                }
                res.status(201).send({
                    status: 1,
                    message: " Customer Type Updated Successfully"
                });
            }
        );
    }
};

/**
 * Action : Remove Customer Type
 * @param TypeId
 */
exports.removeCustomerType = (req, res) => {
    let updateData = req.body.type_details;
    if (req.accessType === "superadmin" || req.accessType === "admin" || req.accessType === "staffs") {
        if (updateData._id) {
            CustomerMeta.update(
                { "customer_types._id": updateData._id },
                {
                    $set: {
                        "customer_types.$.status": updateData.status
                    }
                },
                (err, result) => {
                    if (err){
                        console.error({
                            status: 0,
                            message: "Error removing Customer", 
                            error: err
                        });
                        res.status(500).send({
                            status: 0,
                            message: "Error removing Customer", 
                            error: "Problem with the server"
                        });
                    }
                    res.status(201).send({
                        status: 1,
                        message: "Customer removed successfully", 
                    });
                }
            );
        } else if (!updateData._id) {
            res.status(404).send({
                status: 0,
                message: "The customer you are looking for is not found"
            });
        }
    } else {
        res.status(401).send({ 
            status: 0,
            message: 'UnAuthorized Access',
            error: 'Access Denied'
        })
    }
};




/**
 * Positions Meta details Of a Bracch
 * A Branch Should Have its own positions
 */
/**
 * Action : Get Member Positions
 */
exports.getMemberPositions = (req, res) => {
    let query_value = '';
    if (req.accessType === "superadmin" || req.accessType === "admin" || req.accessType === "staffs") {
        query_value = req.params.branchId;
    } else {
        console.error({ 
            status: 0,
            message: 'UnAuthorized Access',
            error: err
        });
        res.status(401).send({ 
            status: 0,
            message: 'UnAuthorized Access',
            error: "Access Denied"
        });
    }
    CustomerMeta.aggregate(
        [
            { $match: { branch_id: query_value } },
            {
                $addFields: {
                    member_positions: {
                        $filter: {
                            input: "$member_positions",
                            as: "member_position",
                            cond: { $eq: ["$$member_position.status", "active"] }
                        }
                    }
                }
            },
            { $project: { customer_types: 0, services: 0 } }
        ],
        async (err, memberPositions) => {
            if (err){
                console.error({ 
                    status: 0,
                    message: 'Error getting Memeber Positions',
                    error: err
                });
                res.status(500).send({ 
                    status: 0,
                    message: 'Error getting Memeber Positions',
                    error: "Problem with the server"
                });
            }else if(memberPositions.length) {
                await memberPositions[0].member_positions.forEach((member) => {
                        let count = 0;
                        member.access.forEach(async (access) => {
                            await access.access_details.forEach(async (detail) => {
                                await detail.access.forEach((det_ac) => {
                                    if(det_ac.selected) {
                                        count = count+1;
                                        return count
                                    }
                                })
                            });
                            member['access_count'] = count;
                        });
                })

                res.status(200).send({ 
                    status: 1,
                    message: 'Positions Obtained successfully',
                    positions: memberPositions[0].member_positions
                });
            }else{
                res.status(200).send({ 
                    status: 1,
                    message: 'No Positions Available',
                    positions: []
                });
            }
            
        }
    );
};

exports.getMemberPosition = (req, res) => {
    let query_value = '';
    if (req.accessType === "superadmin" || req.accessType === "admin" || req.accessType === "staffs") {
        if(req.position === 'owner'){
            let member_access = [ 
                {
                    "module" : "oms",
                    "access_details" : [ 
                        {
                            "name" : "floor",
                            "access" : [ 
                                {
                                    "name" : "all",
                                    "selected" : true
                                }
                            ],
                            "selected" : true
                        }, 
                        {
                            "name" : "table functions",
                            "access" : [ 
                                {
                                    "name" : "all",
                                    "selected" : true
                                }
                            ],
                            "selected" : true
                        }, 
                        {
                            "name" : "order functions",
                            "access" : [ 
                                {
                                    "name" : "all",
                                    "selected" : true
                                }
                            ],
                            "selected" : true
                        },
                        {
                            "name" : "payment functions",
                            "access" : [ 
                                {
                                    "name" : "all",
                                    "selected" : true
                                }
                            ],
                            "selected" : true
                        },
                        {
                            "name" : "floor rights",
                            "access" : [ 
                                {
                                    "name" : "all",
                                    "selected" : true
                                }
                            ],
                            "selected" : true
                        }, 
                        {
                            "name" : "takeaway",
                            "access" : [ 
                                {
                                    "name" : "all",
                                    "selected" : true
                                }
                            ],
                            "selected" : true
                        }, 
                    ]
                }, 
                {
                    "module" : "my_account",
                    "access_details" : [ 
                        {
                            "name" : "setup",
                            "access" : [ 
                                {
                                    "name" : "all",
                                    "selected" : true
                                }
                            ],
                            "selected" : true
                        }, 
                        {
                            "name" : "management",
                            "access" : [ 
                                {
                                    "name" : "all",
                                    "selected" : true
                                }
                            ],
                            "selected" : true
                        }, 
                        {
                            "name" : "analytics",
                            "access" : [ 
                                {
                                    "name" : "all",
                                    "selected" : true
                                }
                            ],
                            "selected" : true
                        }, 
                        {
                            "name" : "valet",
                            "access" : [ 
                                {
                                    "name" : "all",
                                    "selected" : true
                                }
                            ],
                            "selected" : true
                        }
                    ]
                }
            ]
            let memberAccess = {
                position: req.position,
                access: member_access
            }
            res.status(200).send({ 
                                    status: 1,
                                    message: 'member access obtained successfully',
                                    data:  memberAccess
                                });
        }else  {
            query_value =  { branch_id: req.params.branchId ,'member_positions.position': req.position }

            CustomerMeta.findOne(query_value, (err, result) => {
                if(err){
                    console.log('error----------------', err)
                }else{
                    let memberPosition = result.member_positions.find((x) => x.position === req.position);
                    let memberAccess = {
                        position: memberPosition['position'],
                        access: memberPosition['access']
                    }
                    res.status(200).send({ 
                        status: 1,
                        message: 'member access obtained successfully',
                        data:  memberAccess
                    });
                }
            })
        }
    } else {
        console.error({ 
            status: 0,
            message: 'UnAuthorized Access',
            error: err
        });
        res.status(401).send({ 
            status: 0,
            message: 'UnAuthorized Access',
            error: "Access Denied"
        });
    }
};


/**
 * Action : Add & Update Member Positions
 */
exports.updateMemberPosition = (req, res) => {
    let query_value = '';
    let updateData = req.body.position_details;

    if (req.accessType === "superadmin" || req.accessType === "admin" || req.accessType === "staffs") {
        query_value = updateData.branch_id;
    } else {
        res.status(401).send({
            status: 0, 
            message: 'UnAuthorized Access',
            error: 'Access Denied'
        })
    }
    if (!updateData._id) {
        CustomerMeta.findOne({ branch_id: query_value, company_id: req.companyId }, (err, metaDetails) => { 
            if(err) {
                // TODO: Handle error
                console.error({
                    status: 0,
                    message: "Error Adding Position", 
                    error: err
                });
                res.status(400).send({
                    status: 0,
                    message: "Problem While Adding Position", 
                    error: "problem with the server"
                });
            } else if(metaDetails) {
                // NOTE: this metaDetails is added by default on creating new branch, this action iw written based on existing meta table
                let existingPosition = metaDetails.member_positions.filter((a) => updateData.position === a.position);
                if(existingPosition.length) {
                    console.error({
                        status: 0,
                        message: "Error Adding Position", 
                        error: 'position already exists'
                    });
                    res.status(400).send({
                        status: 0,
                        message: "Problem While Adding Position", 
                        error: "position already exists"
                    });
                } else{
                    CustomerMeta.update(
                        { branch_id: query_value, company_id: req.companyId },
                        {
                            $push: { member_positions: updateData }
                        },
                        { new: true, upsert: true },
                        function (err, result) {
                            if (err) {
                                console.error({
                                    status: 0,
                                    message: "Error Adding Position", 
                                    error: err
                                });
                                res.status(500).send({
                                    status: 0,
                                    message: "Problem While Adding Position", 
                                    error: "Problem with the server"
                                });
                            }else{
                                res.status(200).send({
                                    status: 1,
                                    message: "Position Added Successfully",
                                    position: result
                                });
                            }
                        }
                    );
                }
            } else{
                let meta_details = new CustomerMeta({
                    company_id: req.companyId
                    , branch_id: updateData.branch_id
                    , member_positions: [
                        {
                            "member_count" : 1,
                            "access" : updateData.access,
                            "position" : updateData.position,
                        }
                    ]
                });
                meta_details.save((err, savedPosition) => {
                    if (err) {
                        console.error({
                            status: 0,
                            message: "Error Adding Position", 
                            error: err
                        });
                        res.status(500).send({
                            status: 0,
                            message: "Problem While Adding Position", 
                            error: "Problem with the server"
                        });
                    }else{
                        res.status(200).send({
                            status: 1,
                            message: "Position Added Successfully",
                            position: savedPosition
                        });
                    }
                })
            }
        })  
    } else if (updateData._id) {
        CustomerMeta.findOne({ branch_id: query_value, company_id: req.companyId }, async (err, metaDetails) => { 
            if(err) {
                // TODO: Handle error
                console.error({
                    status: 0,
                    message: "Error Adding Position", 
                    error: err
                });
                res.status(400).send({
                    status: 0,
                    message: "Problem While Adding Position", 
                    error: "problem with the server"
                });
            } else if(metaDetails) {
                // NOTE: this metaDetails is added by default on creating new branch, this action iw written based on existing meta table
                let existingPosition = metaDetails.member_positions.filter((a) => {
                    if((updateData.position === a.position) && (a._id != updateData._id)) {
                        return a
                    };
                });
                if(existingPosition.length) {
                    console.error({
                        status: 0,
                        message: "Error Adding Position", 
                        error: 'position already exists'
                    });
                    res.status(400).send({
                        status: 0,
                        message: "Problem While Adding Position", 
                        error: "position already exists"
                    });
                } else{
                    let selectedPosition = metaDetails.member_positions.filter((member_position) => {
                        if(member_position._id == updateData._id) {
                            return member_position
                        }
                    })[0];

                    let memberCount;
                    if(selectedPosition.position !== updateData.position) {
                        await Member.updateMany({ position: selectedPosition.position, branch_id: updateData.branch_id }, { position: updateData.position }, (err, result) => {
                            if(err) {
                                console.error('Error updating members', err)
                            } else{
                                if(result.n) {
                                    memberCount = result.n
                                } else{
                                    memberCount = selectedPosition.member_count++;
                                }
                            }
                        }) 
                    } else {
                        memberCount = await Member.find({ position: selectedPosition.position, branch_id: updateData.branch_id  }).count();
                    }
                    updateData.member_count = memberCount

                    CustomerMeta.update(
                        { "member_positions._id": updateData._id },
                        {
                            $set: { "member_positions.$": updateData }
                        },
                        function (err, result) {
                            if (err) {
                                console.error({
                                    status: 0,
                                    message: "Problem Updating Position", 
                                    error: err
                                });
                                res.status(400).send({
                                    status: 0,
                                    message: "Problem Updating Position", 
                                    error: "Problem with the server"
                                });
                            }else{
                                res.status(201).send({
                                    status: 1,
                                    message: "Position Updated Successfully",
                                    position: result
                                });
                            }
                        }
                    );
                }
            }
        })
        
    }
};

/**
 * Har remove member position
 */
exports.removeMemberPosition = (req, res) => {
    let updateData = req.body.position_details;
    if (updateData._id) {
        CustomerMeta.update(
            { "member_positions._id": updateData._id },
            {
                $pull: { "member_positions": { _id: updateData._id }}
            },
            (err, result) => {
                if (err) {
                    console.error("error removing customer detail", err);
                    res.send({
                        status: 0,
                        message: "error removing position",
                        error: 'problem with the server'
                    });
                }else if(result){
                    res.send({
                        status: 1,
                        message: "Position removed Successfully"
                    });
                }else{ 
                    res.send({
                        status: 0,
                        message: "error removing position",
                        error: 'problem with the server'
                    });
                }
            }
        );
    } else if (!updateData._id) {
        res.status(404).send({
            status: 0,
            message: "The position you are looking for is not found"
        });
    }
};
/**
 * Action : Soft Remove Member Positions BKP
 */
// exports.removeMemberPosition = (req, res) => {
//     let updateData = req.body.position_details;
//     if (updateData._id) {
//         CustomerMeta.update(
//             { "member_positions._id": updateData._id },
//             {
//                 $set: {
//                     "member_positions.$.status": 'removed'
//                 }
//             },
//             (err, result) => {
//                 if (err) {
//                     console.error("error removing customer detail", err);
//                     res.send({
//                         status: 0,
//                         message: "error removing position",
//                         error: 'problem with the server'
//                     });
//                 }else{
//                     res.send({
//                         status: 1,
//                         message: "Position removed Successfully"
//                     });
//                 }
//             }
//         );
//     } else if (!updateData._id) {
//         res.status(404).send({
//             status: 0,
//             message: "The position you are looking for is not found"
//         });
//     }
// };

/**
 * Used for future
 */
//************** Quick Services Meta *********************//
exports.getServices = (req, res) => {
    CustomerMeta.aggregate(
        [
            { $match: { company_id: req.companyId } },
            {
                $addFields: {
                    member_positions: {
                        $filter: {
                            input: "$services",
                            as: "service",
                            cond: { $eq: ["$$service.status", "active"] }
                        }
                    }
                }
            },
            { $project: { customer_types: 0, member_positions: 0 } } //used for response restriction
        ],
        (err, memberPositions) => {
            if (err) throw err;
            res.json(memberPositions[0]);
        }
    );
};

//NOTE: Not using for now
//respond with only listnames 
exports.getServiceList = (req, res) => {
    CustomerMeta.aggregate(
        [
            { $match: { company_id: req.companyId } },
            {
                $addFields: {
                    member_positions: {
                        $filter: {
                            input: "$services",
                            as: "service",
                            cond: { $eq: ["$$service.status", "active"] }
                        }
                    }
                }
            },
            'services.name',
            { $project: { customer_types: 0, member_positions: 0 } } //used for response restriction
        ],
        (err, memberPositions) => {
            if (err) throw err;
            res.json(memberPositions[0]);
        }
    );
};

exports.updateService = (req, res) => {
    let updateData = req.body.service_detail;
    if (!updateData._id) {
        CustomerMeta.update(
            { company_id: req.companyId },
            {
                $push: { services: updateData }
            },
            { new: true, upsert: true },
            function (err, result) {
                if (err){
                    console.error("error adding new service", err);
                    res.send({
                        status: 0,
                        message: 'error adding new service',
                        error: 'problem with the server'
                    });
                }else{
                    res.send(result);
                }
            }
        );
    } else if (updateData._id) {
        CustomerMeta.update(
            { "services._id": updateData._id },
            {
                $set: { "services.$": updateData }
            },
            function (err, result) {
                if (err){ 
                    console.error("error updating service", err);
                    res.status(500).send({
                        status: 0,
                        mess: 'error updating service',
                        error: 'problem with the server'
                    });
                }else{
                    res.send(result);
                }
            }
        );
    }
};

exports.removeService = (req, res) => {
    let updateData = req.body.service_detail;
    if (updateData._id) {
        CustomerMeta.update(
            { "services._id": updateData._id },
            {
                $set: {
                    "services.$.status": updateData.status
                }
            },
            (err, result) => {
                if (err){ 
                    console.err("error removing service", err);
                    res.status(500).send({
                        status: 0,
                        message: 'error removing service',
                        error: 'problem with the server'
                    })
                }else{
                    res.send(result);
                }
            }
        );
    } else if (!updateData._id) {
        res.send("the service you are looking for is not found");
    }
};