'use strict';
const Member = require("../../models/managementModels/member_directory.model");
const CustomerMetas = require("../../models/managementModels/customer_meta.model");
const User = require('../../models/auth.model');


//members
exports.get_company_members = (req, res) => {
    //TODO get all the members of particular company
}

//member
exports.get_branch_members = (req, res) => {
    //TODO get all the members of particular company
    let branchId = req.params.branchId;
    Member.find({ $and: [{ branch_id: branchId }, { status: 'active' }] }, (err, members) => {
        if (err) {
            console.error('error getting members number', err);
            res.status(500).json({
                status: 0,
                message: 'error getting members',
                error: 'problem with the server'
            })
        } else {
            res.json(members)
        }
    })
}

//can be removed since we are using add in update method
exports.add_new_member = (req, res) => {
    let member = new Member(req.body);
    member.save((err, member) => {
        if (err) {
            console.error("error saving member", err);
            res.status(500).json({
                status: 0,
                message: 'error saving member',
                error: 'problem with the server'
            });
        } else {
            res.status(200).send(member);
        }
    });
}

// exports.update_member = (req, res) => {
//     let updateData = req.body.member_details;
//     let query_value = '';
//     updateData.company_id = req.companyId;
//     if(req.position === 'owner' || req.position === 'manager') {
//         query_value = updateData.branch_id;
//     }else{
//         res.status(401).send({ 'message' : 'UnAuthorized Access' })
//     }
//     // Member.findOne({ company_id : req.companyId, position: { $ne: 'owner' } }, (err, existingMember) => {
//     //     if(err) {
//     //         console.error({
//     //             status:  0,
//     //             message: 'Error Finding Member',
//     //             error: err
//     //         });
//     //         res.status(500).json({
//     //             status:  0,
//     //             message: 'Error Creating Member',
//     //             error: 'Problem with the server'
//     //         });
//     //     }else{
//     //         Member.findOne({ 'pin': updateData.pin, 'branch_id': query_value }, (err, member) => {
//     //             if (err) {
//     //                 console.error({
//     //                     status:  0,
//     //                     message: 'Error Finding Member',
//     //                     error: err
//     //                 });
//     //                 res.status(500).json({
//     //                     status:  0,
//     //                     message: 'Error Finding Member',
//     //                     error: 'Problem with the server'
//     //                 });
//     //             } else if (!member) {
//     //                 if (!updateData._id) {
//     //                     let member = new Member(updateData);
//     //                     member.save((err, member) => {
//     //                         if (err) {
//     //                             console.error({
//     //                                 status: 0,
//     //                                 message: "error saving member",
//     //                                 error: err
//     //                             });
//     //                             res.status(500).json({
//     //                                 status: 0,
//     //                                 message: 'Error Changing member details',
//     //                                 error: 'Problem with the server'
//     //                             })
//     //                         }else{
//     //                             if(!existingMember) {
//     //                                 Member.update({ _id: req.userId }, { $set: { tour_status: 'manager_details' }}, (err, updatedManager) => {
//     //                                     if (err) {
//     //                                         console.error({
//     //                                             status: 0,
//     //                                             message: "error saving member",
//     //                                             error: err
//     //                                         });
//     //                                         res.status(500).json({
//     //                                             status: 0,
//     //                                             message: 'Error Changing member details',
//     //                                             error: 'Problem with the server'
//     //                                         })
//     //                                     }else{
//     //                                         CustomerMeta.findOneAndUpdate({ branch_id: updateData.branch_id , 'member_positions.position': "head chef"}, { $set: { 'member_positions.$.member_count': 1 }})
//     //                                         res.status(200).json(member);
//     //                                     }
//     //                                 })
//     //                             }else{
//     //                                 res.status(200).json(member);
//     //                             }
//     //                         }
//     //                     });
//     //                 } else if (updateData._id) {
//     //                     Member.findById(updateData._id, (err, member) => {
//     //                         if (err) {
//     //                             console.error({
//     //                                 status:  0,
//     //                                 message: 'Error Finding Member',
//     //                                 error: err
//     //                             });
//     //                             res.status(500).json({
//     //                                 status:  0,
//     //                                 message: 'Error Updating Member',
//     //                                 error: 'Problem with the server'
//     //                             });
//     //                         }
//     //                         member.set(updateData);
//     //                         //TODO need to restrict the returning data
//     //                         member.save((err, updatedDetails) => {
//     //                             if (err){
//     //                                 console.error({
//     //                                     status:  0,
//     //                                     message: 'Error saving Member',
//     //                                     error: err
//     //                                 });
//     //                                 res.status(500).json({
//     //                                     status:  0,
//     //                                     message: 'Error Updating Member',
//     //                                     error: 'Problem with the server'
//     //                                 });
//     //                                 // return handleError(err);
//     //                             }else{
//     //                                 res.status(200).send(updatedDetails);
//     //                             }
//     //                         });
//     //                     })
//     //                 }
//     //             } else {
//     //                 console.error({
//     //                     status: 0,
//     //                     message: 'PIN already taken',
//     //                     error: err
//     //                 });
//     //                 res.status(400).send({
//     //                     status: 0,
//     //                     message: 'PIN already taken',
//     //                     error: 'pin already exists'
//     //                 });
//     //             }
//     //         })
//     // //         // if(!existingMember) {
//     // //         //     // Else : Do change in Member's tour Status as manager_detail
//     // //         // }
//     // //         // TODO: Handle case for company has atleast one member
//     // //         // Check: If has Atleast one member in compnay except owner
//     // //         // then, Do as Usual

//     //     }

//     // })
// }

/*
* for backup
*/
exports.update_member = (req, res) => {
    let updateData = req.body.member_details;
    let query_value = '';
    updateData.company_id = req.companyId;
    if (req.accessType === "superadmin" || req.accessType === "admin" || req.accessType === "staffs") {
        query_value = updateData.branch_id;
    } else {
        res.status(401).send({ 'message': 'UnAuthorized Access' })
    }
    Member.findOne({ company_id: req.companyId, position: { $ne: 'owner' } }, (err, existingMember) => {
        if (err) {
            console.error({
                status: 0,
                message: 'Error Finding Member',
                error: err
            });
            res.status(500).json({
                status: 0,
                message: 'Error Creating Member',
                error: 'Problem with the server'
            });
        } else {
            if (updateData._id) {
                Member.findOne({ _id: updateData._id }, (err, member) => {
                    if (err) {
                        console.error({
                            status: 0,
                            message: 'Error Finding Member',
                            error: err
                        });
                        res.status(500).json({
                            status: 0,
                            message: 'Error Finding Member',
                            error: 'Problem with the server'
                        });
                    } else if (!member) {
                        console.error({
                            status: 0,
                            message: 'no members found',
                            error: 'invalid parameters'
                        });
                        res.status(400).send({
                            status: 0,
                            message: 'no members found',
                            error: 'invalid paramters'
                        });
                    } else if (member) {
                        Member.findOne({ 'pin': updateData.pin, 'branch_id': query_value, _id: { $ne: member._id } }, (err, existingPin) => {
                            if (err) {
                                console.error({
                                    status: 0,
                                    message: 'Error Finding Member',
                                    error: err
                                });
                                res.status(500).json({
                                    status: 0,
                                    message: 'Error Updating Member',
                                    error: 'Problem with the server'
                                });
                            } else if (existingPin) {
                                console.error({
                                    status: 0,
                                    message: 'pin already exists',
                                    error: 'invalid parameters'
                                });
                                res.status(400).json({
                                    status: 0,
                                    message: 'pin already exists',
                                    error: 'invalid parameters'
                                });
                            } else {
                                let query = { 'branch_id': updateData.branch_id, 'position': updateData.position, 'name': updateData.name, '_id': { $ne: member._id } };
                                Member.findOne(query, (err, existingMemberDetail) => {
                                    if (err) {
                                        console.error({
                                            status: 0,
                                            message: 'error finding details',
                                            error: err
                                        });
                                        res.status(500).json({
                                            status: 0,
                                            message: 'error finding details',
                                            error: 'problem with the server'
                                        });
                                    } else if (existingMemberDetail) {
                                        console.error({
                                            status: 0,
                                            message: 'member with the position already exists',
                                            error: 'invalid parameters'
                                        });
                                        res.status(400).json({
                                            status: 0,
                                            message: 'member with the position already exists',
                                            error: 'invalid parameters'
                                        });
                                    } else {
                                        if (member.position === updateData.position) {
                                            member.set(updateData);
                                            // TODO need to restrict the returning data
                                            member.save((err, updatedDetails) => {
                                                if (err) {
                                                    console.error({
                                                        status: 0,
                                                        message: 'Error saving Member',
                                                        error: err
                                                    });
                                                    res.status(500).json({
                                                        status: 0,
                                                        message: 'Error Updating Member',
                                                        error: 'Problem with the server'
                                                    });
                                                    // return handleError(err);
                                                } else {
                                                    res.status(200).send(updatedDetails);
                                                }
                                            });
                                        } else {
                                            // member.set(updateData);
                                            CustomerMetas.findOne({ branch_id: member.branch_id }, async (err, positionDetails) => {
                                                if (err) {
                                                } else if (positionDetails) {
                                                    await positionDetails.member_positions.forEach((memberP) => {
                                                        if (memberP.position === updateData.position) {
                                                            memberP.member_count++
                                                        } else if ((memberP.position === member.position) && (memberP.member_count !== 0)) {
                                                            memberP.member_count--
                                                        }
                                                    });
                                                    let customer_meta = new CustomerMetas(positionDetails);

                                                    customer_meta.save((err, result) => {
                                                        if (err) {
                                                            console.error({
                                                                status: 0,
                                                                message: 'Error saving Member',
                                                                error: err
                                                            });
                                                            res.status(500).json({
                                                                status: 0,
                                                                message: 'Error Updating Member',
                                                                error: 'Problem with the server'
                                                            });
                                                        } else {
                                                            member.set(updateData);
                                                            // TODO need to restrict the returning data
                                                            member.save((err, updatedDetails) => {
                                                                if (err) {
                                                                    console.error({
                                                                        status: 0,
                                                                        message: 'Error saving Member',
                                                                        error: err
                                                                    });
                                                                    res.status(500).json({
                                                                        status: 0,
                                                                        message: 'Error Updating Member',
                                                                        error: 'Problem with the server'
                                                                    });
                                                                    // return handleError(err);
                                                                } else {
                                                                    res.status(200).send(updatedDetails);
                                                                }
                                                            });
                                                        }
                                                    })
                                                }
                                            })
                                        }
                                    }
                                })
                            }
                        })
                    } else {
                        console.error({
                            status: 0,
                            message: 'PIN already taken',
                            error: err
                        });
                        res.status(400).send({
                            status: 0,
                            message: 'PIN already taken',
                            error: 'pin already exists'
                        });
                    }
                })
            } else {
                Member.findOne({ 'pin': updateData.pin, 'branch_id': query_value }, (err, memberDetails) => {
                    if (err) {
                        console.error({
                            status: 0,
                            message: "error getting member",
                            error: err
                        });
                        res.status(500).json({
                            status: 0,
                            message: 'error getting member details',
                            error: 'Problem with the server'
                        })
                    } else if (memberDetails) {
                        console.error({
                            status: 0,
                            message: "pin already exists",
                            error: 'invalid parameter'
                        });
                        res.status(400).json({
                            status: 0,
                            message: 'pin already exists',
                            error: 'invalid parameter'
                        })
                    } else {

                        let query = { 'branch_id': updateData.branch_id, 'position': updateData.position, 'name': updateData.name };
                        Member.findOne(query, (err, existingMemberDetail) => {
                            if (err) {
                                console.error({
                                    status: 0,
                                    message: 'error finding details',
                                    error: err
                                });
                                res.status(500).json({
                                    status: 0,
                                    message: 'error finding details',
                                    error: 'problem with the server'
                                });
                            } else if (existingMemberDetail) {
                                console.error({
                                    status: 0,
                                    message: 'member with the position already exists',
                                    error: 'invalid parameters'
                                });
                                res.status(400).json({
                                    status: 0,
                                    message: 'member with the position already exists',
                                    error: 'invalid parameters'
                                });
                            } else {
                                let member = new Member(updateData);
                                member.save(async (err, member) => {
                                    if (err) {
                                        console.error({
                                            status: 0,
                                            message: "error saving member",
                                            error: err
                                        });
                                        res.status(500).json({
                                            status: 0,
                                            message: 'Error Changing member details',
                                            error: 'Problem with the server'
                                        })
                                    } else {
                                        await CustomerMetas.findOneAndUpdate({
                                            branch_id: updateData.branch_id,
                                            'member_positions.position': member.position
                                        }, {
                                            $push: { 'member_positions.$.members': member._id },
                                            $inc: {
                                                'member_positions.$.member_count': 1
                                            }
                                        });
                                        if (!existingMember) {
                                            Member.update({ _id: req.userId }, { $set: { tour_status: 'manager_details' } }, (err, updatedManager) => {
                                                if (err) {
                                                    console.error({
                                                        status: 0,
                                                        message: "error saving member",
                                                        error: err
                                                    });
                                                    res.status(500).json({
                                                        status: 0,
                                                        message: 'Error Changing member details',
                                                        error: 'Problem with the server'
                                                    })
                                                } else {
                                                    res.status(200).json(member);
                                                }
                                            })
                                        } else {
                                            res.status(200).json(member);
                                        }
                                    }
                                });
                            }
                        })
                    }
                })
            }
        }
    })
}

exports.remove_member = (req, res) => {
    let updateData = req.body.member_details;
    Member.findById(updateData._id, (err, member) => {
        if (err) {
            return handleError(err);
        } else if (member.position === 'manager') {
            res.status(404).json({
                status: 0,
                message: 'invalid access',
                error: 'manager cannot be deleted'
            });
        } else {
            // member.set({ 'status': "removed" });
            //TODO need to restrict the returning data
            Member.findOneAndRemove({ _id: updateData._id }, async (err, updatedDetails) => {
                if (err) {
                    // return handleError(err);
                    res.status(500).json({
                        status: 0,
                        message: 'error removing member',
                        error: 'invalid parameter'
                    });
                } else {
                    await CustomerMetas.findOneAndUpdate({
                        branch_id: updateData.branch_id,
                        'member_positions.position': member.position
                    }, {
                        $inc: {
                            'member_positions.$.member_count': -1
                        }
                    });
                    // res.send(updatedDetails);
                    res.status(201).json({
                        status: 1,
                        message: 'memeber removed successfully'
                    })
                }
            });
        }
    })

}

/**
 * Note: Used this for soft remove (DEPRICATED)
 */
// exports.remove_member = (req, res) => {
//     let updateData = req.body.member_details;

//     Member.findById(updateData._id, (err, member) => {
//         if (err) {
//             return handleError(err);
//         }else if(member.position === 'manager') {
//             res.status(404).json({ 
//                 status: 0,
//                 message: 'invalid access',
//                 error: 'manager cannot be deleted'
//             });
//         }else{
//             member.set({ 'status': "removed" });
//             //TODO need to restrict the returning data
//             member.save((err, updatedDetails) => {
//                 if (err) return handleError(err);
//                 res.send(updatedDetails);
//             });
//         }
//     })
// }

exports.reset_member_pin = (req, res) => {
    let pin_details = req.body.auth_pin;
    let member_data = req.body.member_data;
    let query;
    if(req.accessType === 'superadmin') {
        query = { 'company_id': req.companyId, 'position': 'owner' }
    }else{
        query = { 'branch_id': member_data.branch_id, 'position': 'manager' }
    }
    Member.findOne(query, (err, manager) => {
        if (err) {
            console.error({
                status: 0,
                message: 'Error Occured when finding member',
                error: err
            })
            res.status(500).json({
                status: 0,
                message: 'Error Occured when finding member',
                error: 'Problem with the server'
            })
        }
        /**
         * Note Number() will parse the string to a number
         * If we pass that as a number we don't need the Number();
         */
        else if (manager.pin === Number(pin_details.manager_pin)) {
            res.status(200).json({
                status: 1,
                message: 'success'
            });
            // this.update_member({ member_details : { _id: member._id,  pin : pin_details.pin }}).then(result => {
            // }).catch(err=> {
            //     console.error('getting error', err);
            // })
        } else {
            res.status(200).json({
                status: 1,
                message: 'failure',
                error: 'permission denied, invalid pin'
            });
        }
    })
}


/**
 * Check and Validate manager pin
 */
exports.validate_pin = (req, res) => {
    if (req.accessType === 'superadmin') {
        let enteredPin = req.params.pin;
        Member.findOne(
            { _id: req.userId, pin: enteredPin },
            (err, user) => {
                if (err) {
                    console.error({
                        status: 0,
                        message: "Error validating pin",
                        error: err
                    });
                    res.status(500).json({
                        status: 0,
                        message: "Error validating pin",
                        error: "Problem with server"
                    });
                }
                else {
                    if (!user) {
                        res.status(401).json({
                            status: 0,
                            message: "No member found",
                            error: "Invalid PIN"
                        });
                    } else {
                        res.status(200).json({
                            status: 1,
                            message: "Access granted",
                        });
                    }
                }
            }
        );
    } else if (req.accessType === 'admin' || req.accessType === 'staffs') {
        let enteredPin = req.params.pin;

        Member.findOne(
            { branch_id: req.branchId, position: 'manager', pin: enteredPin },
            (err, user) => {
                if (err) {
                    console.error({
                        status: 0,
                        message: "Error validating pin",
                        error: err
                    });
                    res.status(500).json({
                        status: 0,
                        message: "Error validating pin",
                        error: "Problem with server"
                    });
                }
                else {
                    if (!user) {
                        res.status(401).json({
                            status: 0,
                            mesage: "No Member found",
                            error: 'Invalid PIN'
                        });
                    } else {
                        res.status(200).json({
                            status: 1,
                            message: 'Access Granted',
                        });
                    }
                }
            }
        );
    }
}

exports.updateTourStatus = (req, res) => {
    let updateData = req.body.member_details;
    Member.findOneAndUpdate({ _id: req.userId }, { $set: { tour_status: updateData.status } }, (err, member) => {
        if (err) {
            res.status(500).json({
                status: 0,
                message: 'updated failure',
                error: 'problem with the server'
            })
        } else {
            res.status(201).json({
                status: 0,
                message: 'updated successfully'
            })
        }
    })
}

exports.get_member = (req, res) => {
    //TODO get all the members of particular company
    Member.findById( req.query.memberid , (err, members) => {
        if (err) {
            console.error('error getting member information', err);
            res.status(500).json({
                status: 0,
                message: 'error getting members',
                error: 'problem with the server'
            })
        } else {
            res.json(members)
        }
    })
}