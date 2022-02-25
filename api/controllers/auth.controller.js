"use strict";
const User = require("../models/auth.model");
const Member = require("../models/managementModels/member_directory.model");
const CustomerMeta = require("../models/managementModels/customer_meta.model");
const jwt = require("jsonwebtoken");

/**
 * Api for registering a new Company
 */
exports.register_user = (req, res) => {
    let userData = req.body;
    let user = new User(userData);
    user.save((err, registeredUser) => {
        if (err) {
            console.error({
                status: 0,
                message: "error occured while registering user",
                error: err
            });
            res.status(401).send({
                status: 0,
                message: "error occured while registering user",
                error: "Problem with the server"
            });
        } else {
            let payload = { subject: registeredUser._id };
            let token = jwt.sign(payload, "thisissparta");
            res.status(200).json({
                status: 1,
                message: 'Success',
                user: registeredUser,
                token: token
            });
        }
    });
};

/**
 * Member login
 */
exports.login_user = (req, res) => {
    let userData = req.body;
    User.findOne({ email: userData.email.toLowerCase() }, (err, user) => {
        if (err) {
            console.error({
                status: 0,
                message: "Error logging in user",
                error: err
            });
            res.status(401).send({
                status: 0,
                message: "Error logging in user",
                error: 'Problem with the server'
            });
        } else {
            if (!user) {
                console.error({
                    status: 0,
                    message: "No user found",
                    error: 'Problem finding user in DB'
                });
                res.status(401).json({
                    status: 0,
                    message: "No user found",
                    error: 'No user found'
                });
            } else if (!user.comparePassword(userData.password)) {
                console.error({
                    status: 0,
                    message: "Invalid Password",
                    error: 'Invalid Credentials'
                });
                res.status(401).json({
                    status: 0,
                    message: "Invalid Password",
                    error: 'Invalid Credentials'
                });
            } else {
                if (user.user_type === "superadmin") {
                    res.status(200).json({
                        status: 1,
                        message: 'User Authorised',
                        company_id: user.company_id
                    });
                } else if (user.user_type === "admin") {
                    res.json({
                        status: 1,
                        message: 'User Authorised',
                        branch_id: user.branch_id
                    });
                }
            }
        }
    });
};

/**
 * Member PIN Login
 */
exports.pin_login = (req, res) => {
    let member = req.body.memberDetail;
    let deviceToken = undefined;

    if (member.push_tokens) {
        deviceToken = member.push_tokens;
    }
    if (member.type === "superadmin") {
        /**
         * Members who have admin access
         * TODO: Reduce it to one simple function
         */
        Member.findOne(
            { position: 'owner', company_id: member.company_id, pin: member.pin },
            async (err, user) => {
                if (err) {
                    console.error({
                        status: 0,
                        message: "error validatin pin",
                        error: err
                    });
                    res.send({
                        status: 0,
                        message: "error validatin pin",
                        error: 'Error Validating PIN'
                    });
                } else {
                    if (!user) {
                        console.error({
                            status: 0,
                            message: "Error finding user",
                            error: err
                        });
                        res.status(401).json({
                            status: 0,
                            message: "Invalid PIN",
                            error: 'Invalid PIN'
                        });
                    } else {
                        let payload = {
                            userId: user._id
                            , userName: user.name
                            , companyId: user.company_id
                            , position: user.position
                            , accessType: user.position == 'owner' ? "superadmin" : "staffs"
                            // NOTE: The above sending member_access is static, will be imprved by fetching it from DB in future
                            // NOTE: This should be changed if the access changes
                        };

                        // member_access : [ 
                        //     {
                        //         "module" : "oms",
                        //         "access_details" : [ 
                        //             {
                        //                 "name" : "floor",
                        //                 "access" : [ 
                        //                     {
                        //                         "name" : "all",
                        //                         "selected" : true
                        //                     }
                        //                 ],
                        //                 "selected" : true
                        //             }, 
                        //             {
                        //                 "name" : "table functions",
                        //                 "access" : [ 
                        //                     {
                        //                         "name" : "all",
                        //                         "selected" : true
                        //                     }
                        //                 ],
                        //                 "selected" : true
                        //             }, 
                        //             {
                        //                 "name" : "order functions",
                        //                 "access" : [ 
                        //                     {
                        //                         "name" : "all",
                        //                         "selected" : true
                        //                     }
                        //                 ],
                        //                 "selected" : true
                        //             },
                        //             {
                        //                 "name" : "payment functions",
                        //                 "access" : [ 
                        //                     {
                        //                         "name" : "all",
                        //                         "selected" : true
                        //                     }
                        //                 ],
                        //                 "selected" : true
                        //             },
                        //             {
                        //                 "name" : "floor rights",
                        //                 "access" : [ 
                        //                     {
                        //                         "name" : "all",
                        //                         "selected" : true
                        //                     }
                        //                 ],
                        //                 "selected" : true
                        //             }, 
                        //             {
                        //                 "name" : "takeaway",
                        //                 "access" : [ 
                        //                     {
                        //                         "name" : "all",
                        //                         "selected" : true
                        //                     }
                        //                 ],
                        //                 "selected" : true
                        //             }, 
                        //         ]
                        //     }, 
                        //     {
                        //         "module" : "my_account",
                        //         "access_details" : [ 
                        //             {
                        //                 "name" : "setup",
                        //                 "access" : [ 
                        //                     {
                        //                         "name" : "all",
                        //                         "selected" : true
                        //                     }
                        //                 ],
                        //                 "selected" : true
                        //             }, 
                        //             {
                        //                 "name" : "management",
                        //                 "access" : [ 
                        //                     {
                        //                         "name" : "all",
                        //                         "selected" : true
                        //                     }
                        //                 ],
                        //                 "selected" : true
                        //             }, 
                        //             {
                        //                 "name" : "analytics",
                        //                 "access" : [ 
                        //                     {
                        //                         "name" : "all",
                        //                         "selected" : true
                        //                     }
                        //                 ],
                        //                 "selected" : true
                        //             }, 
                        //             {
                        //                 "name" : "valet",
                        //                 "access" : [ 
                        //                     {
                        //                         "name" : "all",
                        //                         "selected" : true
                        //                     }
                        //                 ],
                        //                 "selected" : true
                        //             }
                        //         ]
                        //     }
                        // ],

                        if(user.tour_status !== 'done') {
                            payload.tour_status = user.tour_status;
                        }
                        if(user.assigned_server_printer_ip) {
                            payload.assigned_server_printer_ip = user.assigned_server_printer_ip
                        }
                        let token = jwt.sign(payload, "thisissparta");

                        if (deviceToken && !user.push_tokens.length) {
                            user.push_tokens.push(deviceToken);
                            user.save((err, insertedToken) => {
                                if (err) {
                                    console.error({
                                        status: 0,
                                        message: 'Error saving token',
                                        error: err
                                    });
                                    res.status(400).send({
                                        status: 0,
                                        message: 'Error saving token',
                                        error: 'Problem with user device config'
                                    })
                                } else{
                                    res.status(200).json({
                                        status: 1,
                                        message: 'User Authenticated',
                                        token: token
                                    });
                                }
                            })
                        } else if (deviceToken && user.push_tokens.length) {

                            let ExistinToken = user.push_tokens.filter((token) => {
                                return token.endpoint === deviceToken.endpoint
                            })

                            if (!ExistinToken.length) {
                                /**
                                 * Emptying the existing customer deive_token below , 
                                 * since we just want to store only one token at a time
                                 * If incase if the product owner want multiple device logins remove the emptying thing below
                                 */
                                user.push_tokens = [];
                                user.push_tokens.push(deviceToken);
                                user.save((err, insertedToken) => {
                                    if (err) {
                                        console.error({
                                            status: 0,
                                            message: 'error saving token',
                                            error: err
                                        });
                                        res.status(400).send({
                                            status: 0,
                                            message: 'error saving token',
                                            error: 'error with your device config'
                                        });
                                    } else {
                                        res.status(200).json({
                                            status: 1,
                                            message: 'User Authenticated',
                                            token: token
                                        });
                                    }
                                })
                            } else {
                                res.status(200).json({
                                    status: 1,
                                    message: 'User Authenticated',
                                    token: token
                                });
                            }
                        } else {
                            res.status(200).json({
                                status: 1,
                                message: 'User Authenticated',
                                token: token
                            });
                        }
                    }
                }
            }
        );
    } else if (member.type === "admin" || member.type === "staffs") {
        /**
         * members who don't have super admin access
         */
        Member.findOne(
            { branch_id: member.branch_id, pin: member.pin },
            async (err, user) => {
                if (err) {
                    console.error({
                        status: 0,
                        message: "Error Validating PIN",
                        error: err
                    });
                    res.send({
                        status: 0,
                        message: "error validatin pin",
                        error: 'Error Validating PIN'
                    });
                }
                else {
                    if (!user) {
                        console.error({
                            status: 0,
                            message: "Error finding user",
                            error: err
                        });
                        res.status(401).json({
                            status: 0,
                            message: "Invalid PIN",
                            error: 'Invalid PIN'
                        });
                    } else {
                        let payload = {
                            userId: user._id
                            , userName: user.name
                            , companyId: user.company_id
                            , branchId: user.branch_id
                            , position: user.position
                            , accessType: user.position === 'manager' ? 'admin' : 'staffs'
                        };
                        if(user.tour_status !== 'done') {
                            payload.tour_status = user.tour_status;
                        }
                        if(user.assigned_server_printer_ip) {
                            payload.assigned_server_printer_ip = user.assigned_server_printer_ip
                        }
                        // let token = jwt.sign(payload, "thisissparta");

                        // let test = await CustomerMeta.findOne({ branch_id: user.branch_id }, async (err, positionlist) => {
                        //     if(err) {
                        //         console.error({
                        //             status: 0,
                        //             message: 'problem with the server',
                        //             error: err
                        //         });
                        //         res.status(500).send({
                        //             status: 0,
                        //             message: 'error finding user access',
                        //             error: 'problem with the server'
                        //         })
                        //     } else{
                        //         let temp_var = await positionlist.member_positions.filter((member_position) => {
                        //             if(member_position.position === user.position) {
                        //                 return member_position
                        //             }
                        //         });
                        //         let member_access;

                        //         if( temp_var.length) {
                        //             member_access = temp_var[0].access;
                        //             payload.member_access = member_access;
                        //         }else{
                        //             payload.member_access = {};
                        //         }
                        //     }
                        // });

                        let position_meta = await CustomerMeta.findOne({ branch_id: user.branch_id })
                            
                        let temp_var = await position_meta.member_positions.filter((member_position) => {
                            if(member_position.position === user.position) {
                                return member_position
                            }
                        });
                        
                        // let member_access;

                        // if(temp_var && temp_var.length) {
                        //     member_access = temp_var[0].access;
                        //     payload.member_access = member_access;
                        // }else{
                        //     payload.member_access = [];
                        // }
                        let token = jwt.sign(payload, "thisissparta");

                        if (deviceToken && !user.push_tokens.length) {
                            user.push_tokens.push(deviceToken);
                            user.save((err, insertedToken) => {
                                if (err) {
                                    console.error({
                                        status: 0,
                                        message: 'Error saving token',
                                        error: err
                                    });
                                    res.status(400).send({
                                        status: 0,
                                        message: 'Error saving token',
                                        error: 'Problem with user device config'
                                    })
                                } else{
                                    res.status(200).json({
                                        status: 1,
                                        message: 'User Authenticated',
                                        token: token
                                    });
                                }
                            })
                        } else if (deviceToken && user.push_tokens.length) {
                            let ExistinToken = user.push_tokens.filter((token) => {
                                return token.endpoint === deviceToken.endpoint
                            })

                            if (!ExistinToken.length) {
                                /**
                                 * Emptying the existing customer deive_token below , 
                                 * since we just want to store only one token at a time
                                 * If incase if the product owner want multiple device logins remove the emptying thing below
                                 */
                                user.push_tokens = [];
                                user.push_tokens.push(deviceToken);
                                user.save((err, insertedToken) => {
                                    if (err) {
                                        console.error({
                                            status: 0,
                                            message: 'error saving token',
                                            error: err
                                        });
                                        res.status(400).send({
                                            status: 0,
                                            message: 'error saving token',
                                            error: 'error with your device config'
                                        });
                                    } else {
                                        res.status(200).json({
                                            status: 1,
                                            message: 'User Authenticated',
                                            token: token
                                        });
                                    }
                                })
                            } else {
                                res.status(200).json({
                                    status: 1,
                                    message: 'User Authenticated',
                                    token: token
                                });
                            }
                        } else {
                            res.status(200).json({
                                status: 1,
                                message: 'User Authenticated',
                                token: token
                            });
                        }
                    }
                }
            }
        );
    } else  {
        res.send({
            status: 0,
            message: "invalid access typ4",
            error: 'permission denied'
        });
    }
};

/**
 * Validate Reset Token Here
 */
exports.validate_reset_token = (req, res) => {
    User.findOne({ reset_password_token: req.params.tokenKey, reset_password_expires: { $gt: Date.now() } }, function (err, user) {
		if(err) {
			console.error({
				status: 0,
				message: 'error finding token',
				error: err
			});
			res.status(500).json({
				status: 0,
				message: 'error finding token',
				error: 'problem with the server'
			})
		}else{
			if(!user) {
				console.error({
					status: 0,
					message: 'Error Finding User',
					error: err
				});
				res.status(200).json({
					status: 0,
					message: 'Password reset token is invalid or has expired.',
					error: 'Invalid token.'
				})
			}else{
				res.status(200).json({
					status: 1,
					message: 'valid token',
				})
			}
		}
	})
}