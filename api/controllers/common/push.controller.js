/**
 * Temp declaration
 */
const Member = require("../../models/managementModels/member_directory.model");
const Customer = require("../../models/managementModels/customer_directory.model");
const Orders = require('../../models/omsModels/order.model');
const Table = require("../../models/omsModels/table.model");
const User = require("../../models/auth.model");
const webpush = require('web-push');
const gcm = require('node-gcm');
const apn = require('apn');
const PositionModel = require('../../models/managementModels/customer_meta.model');

const vapidKeys = {
    "publicKey":"BITPhyyWOq0aWQ_v-dAVabgELdJbIY3s48M2d_X7LRj8YNNKdtWL8FJvU4K4s6NiGfa1ldkcTHJsdn14FWhUs28",
    "privateKey":"NkXmO72ZRByB8d8DxljjrlNjB4oVpLvVFbKx7CYjrJQ"
}

webpush.setVapidDetails(
    "mailto:rianozal@gmail.com",
    vapidKeys.publicKey,
    vapidKeys.privateKey
);

// TODO: Handle function to send push notification to branch Members
exports.notifyBranchMembers = function notifyBranchMembers(branchId, data) {
    return new Promise((resolve, reject) => {
        Member.find(
            { branch_id: branchId, push_tokens: { $not: { $size: 0 } } },
            { push_tokens: 1, _id: 0 },
            (err, membersWithToken) => {
                const notificationPayload = {
                    notification: {
                        title: "DiNAMIC POS",
                        body: data.message ? data.message : 'dummy content',
                        icon: "assets/icons/icon-144x144.png",
                        vibrate: [100, 50, 100],
                        type: "update",
                        data: {
                            dateOfArrival: Date.now(),
                            primaryKey: 1,
                            content: data.message
                        },
                        actions: [
                            { action: "explore", title: "New Notification" }
                        ]
                    }
                };

                if (membersWithToken && membersWithToken.length) {
                    membersWithToken.forEach((member) => {
                        if (member.push_tokens.length > 0) {
                            member.push_tokens[0].application_type = 'web'; //Passing here a static value since we don't store application type for members
                            return notifyUser(member.push_tokens[0], data).then((result) => {
                                resolve(result);
                            }).catch((err) => {
                                resolve(err)
                            })
                        }
                    });
                    Promise.all(
                        membersWithToken.map(sub => {
                            webpush.sendNotification(
                                sub.push_tokens[0],
                                JSON.stringify(notificationPayload)
                            )
                        })
                    ).then(() => {
                        resolve({ message: 'success' })
                    }).catch(err => {
                        console.error({
                            status: 0,
                            message: "Error sending notification, reason: ",
                            error: err
                        });
                        reject({
                            status: 0,
                            message: "Error sending notification, reason: ",
                            error: err
                        })
                    });
                } else {
                    resolve({ message: 'No device token found' })
                }
            }
        );
    })
}
// TODO: Handle function to send push notification to table members
exports.notifyTableMembers = function notifyTableMembers(tableId, data) {
    return new Promise((resolve, reject) => {
        Table.findById({ _id: tableId }, (err, table) => {
            if (err) {
                console.error({
                    status: 0,
                    message: 'Error finding table 1',
                    error: err
                });
                reject({
                    status: 0,
                    message: 'Error finding table',
                    error: 'Problem with the server'
                })
            } else {
                if (table.members.length) {
                    let userIds = table.members.map((member) => {
                        return member.user_id;
                    });

                    return Customer.find({ '_id': { $in: userIds } }, (err, users) => {
                        if (err) {
                            console.error({
                                status: 0,
                                message: 'Error Finding Customers',
                                error: err
                            });
                            reject({
                                status: 0,
                                message: 'Error Finding Customers',
                                error: 'problem with the server'
                            });
                        } else {
                            users.forEach((user) => {
                                if (user.device_token.length > 0) {
                                    user.device_token.forEach((token) => {
                                        return notifyUser(token, data).then((result) => {
                                            resolve(result);
                                        }).catch(err => {
                                            resolve(err)
                                        })
                                    })
                                } else {
                                    resolve({ message: 'no device token found' })
                                }
                            });

                        }
                    })
                } else {
                    console.error({
                        status: 1,
                        message: 'No Members in table',
                        error: err
                    });
                    reject({
                        status: 1,
                        message: 'No Members in table',
                        error: 'No Customers in table'
                    });
                }
            }
        })
    })
}

// TODO: Handle function to send push notification to table members
exports.notifyZoneMembers = async function notifyZoneMembers(branchId, floorId, tableId, data) {
    // return new Promise((resolve, reject) => {
        try {
            //TODO
            // [X] get the table id
            // [X] get the memeber ids from table data
            // let activeTable = await Table.findOne({ _id: tableId }).populate('members','name device_token')
            // let tableMembers = activeTable.members;
            // [X] fetch the memebers details [by means push tokens]
            // [X] now loop throught each tokens and send notification
            // tableMembers.forEach((user) => {
            //     if (user.device_token.length > 0) {
            //         user.device_token.forEach((token) => {
            //             notifyUser(token, data) 
            //         })
            //     } else {
            //         // resolve({ message: 'no device token found' })
            //         return { message: 'no device token found' }
            //     }
            // });

            let activeBranchPostions = await PositionModel.aggregate(
                    [
                        { $match: { branch_id: branchId } } ,
                        { $unwind: { path: "$member_positions" }},
                        // { $project: { incharge:1, 'member_positions._id': 1 }},
                        {
                            $lookup: {
                                from: 'members_directory',
                                localField: 'member_positions._id',
                                foreignField: 'position_id',
                                as: 'members_list'
                            }
                        },
                        { $project: { "customer_types": 0, "branch_id": 0,"company_id" : 0, "__v":0 }}
                    ]
                );
            // let Members = await Member.find({ branch_id: branchId }).populate({
            //     path: 'position_id',
            //     populate: {
            //       path: 'member_position',
            //       model: 'customer_meta'
            //     }
            //   })

            let membersPush = [];
            activeBranchPostions.forEach((position) => {
                if(position.member_positions && position.member_positions.access &&  position.member_positions.access.length) {
                    let omsAccess = position.member_positions.access.find(x => x.module == 'oms')
                    let floorAccess = omsAccess.access_details.find(x => x.name == 'floor rights')
                    if(floorAccess && floorAccess.selected) {
                        let selectedFloor = floorAccess.access.find(x => x.floor_id == floorId && x.selected);
                        let hasAllFloorAccess = floorAccess.access.find((x) => x.name == 'all' && x.selected);
                        if(hasAllFloorAccess) {
                            position.members_list.forEach((member) => {
                                if(member.push_tokens) {
                                    membersPush.push(member.push_tokens);
                                }
                            })
                        }
                        if(selectedFloor) {
                            let selectedTable = selectedFloor.tables.find(y => y.table_id == tableId && y.selected);
                            if(selectedTable) {
                                position.members_list.forEach((member) => {
                                    if(member.push_tokens && member.push_tokens.length) {
                                        membersPush.push(member.push_tokens);
                                    }
                                })
                            }
                        }
                        return position
                    }
                }
            })


            membersPush.flat(Infinity).forEach((token) => {
                notifyUser(token, data)
                // .then((result) => {
                //     resolve(result);
                // }).catch(err => {
                //     resolve(err)
                // })
            })
            
            // return activeBranchPostions

            // Branch.aggregate(
            //     [
            //         { $match: { _id: mongoose.Types.ObjectId(branch_id) } },
            //         { $addFields: { "branch_id": { "$toString": "$_id" } } },
            //         {
            //             $lookup: {
            //                 from: 'menu_categories',
            //                 localField: 'branch_id',
            //                 foreignField: 'branch_id',
            //                 as: 'categories_list'
            //             }
            //         },
            //         { $project: { "branch_id": 0, "categories_list.branch_id": 0 } }
            //     ]

            // [] get the position list of the branch
            
            // filter out the positions which has access to the particular tableId
            
            // populate the members of the associated branch
            // get their push tokens
            // send notification to the staffs end
            // NOTE: Should remove branch members notification
            // return true
        }catch(err){
            console.log('error sending notification')
        }


        // Table.findById({ _id: tableId }, (err, table) => {
        //     if (err) {
        //         console.error({
        //             status: 0,
        //             message: 'Error finding table 1',
        //             error: err
        //         });
        //         reject({
        //             status: 0,
        //             message: 'Error finding table',
        //             error: 'Problem with the server'
        //         })
        //     } else {
        //         if (table.members.length) {
        //             let userIds = table.members.map((member) => {
        //                 return member.user_id;
        //             });

        //             return Customer.find({ '_id': { $in: userIds } }, (err, users) => {
        //                 if (err) {
        //                     console.error({
        //                         status: 0,
        //                         message: 'Error Finding Customers',
        //                         error: err
        //                     });
        //                     reject({
        //                         status: 0,
        //                         message: 'Error Finding Customers',
        //                         error: 'problem with the server'
        //                     });
        //                 } else {
        //                     users.forEach((user) => {
        //                         if (user.device_token.length > 0) {
        //                             user.device_token.forEach((token) => {
        //                                 return notifyUser(token, data).then((result) => {
        //                                     resolve(result);
        //                                 }).catch(err => {
        //                                     resolve(err)
        //                                 })
        //                             })
        //                         } else {
        //                             resolve({ message: 'no device token found' })
        //                         }
        //                     });

        //                 }
        //             })
        //         } else {
        //             console.error({
        //                 status: 1,
        //                 message: 'No Members in table',
        //                 error: err
        //             });
        //             reject({
        //                 status: 1,
        //                 message: 'No Members in table',
        //                 error: 'No Customers in table'
        //             });
        //         }
        //     }
        // })
    // })
}

// TODO: Handle function to send push notification to Order based users
exports.notifyOrderMembers = function notifyOrderMembers(orderId, data) {
    return new Promise((resolve, reject) => {

        Orders.findOne({ order_id: orderId }, (err, order) => {
            if (err) {
                console.error({
                    status: 0,
                    message: 'Error finding table 2',
                    error: err
                });
                reject({
                    status: 0,
                    message: 'Error finding table',
                    error: 'Problem with the server'
                })
            } else {
                if (!order) {
                    console.error({
                        status: 0,
                        message: 'order not found',
                        error: 'order does not exists'
                    });
                    resolve({
                        status: 0,
                        message: 'Error finding table',
                        error: 'Problem with the server'
                    })
                } else {
                    let user_id = order.delivery_address.customer_id;

                    Customer.findById(user_id, (err, user) => {
                        if (user.device_token.length > 0) {
                            user.device_token.forEach((token) => {
                                return notifyUser(token, data).then((result) => {
                                    resolve(result);
                                }).catch(err => {
                                    resolve(err)
                                })
                            })
                        } else {
                            resolve({ message: 'no device token found' })
                        }
                    })
                }
            }
        })
    })
}

// TODO Notify Branch Manger
// exports.notifyBranchManagers = async function notifyBranchManagers() {
//     return new Promise((resolve, reject) => {

//     })
// }
// // TODO: Notify Company Admin
// exports.notifyCompanyAdmin = async function notifyCompanyAdmin() {
//     return new Promise((resolve, reject) => {

//     })
// }
// Notify all available users
// exports.notifyAllUsers = async function notifyAllUsers () {
//     return new Promise((resolve, reject) => {

//     })
// }
// Single Notification
function notifyUser(userToken, data) {
    return new Promise((resolve, reject) => {
        if (userToken.application_type === 'mobile') {
            if (userToken.device_type === 'android') {
                resolve(notifyAndroid(userToken, data))
            } else if (userToken.device_type === 'ios') {
                resolve(notifyIos(userToken, data))
            }
        } else if (userToken.application_type === 'web') {
            resolve(notifyWeb(userToken, data));
        } else {
            console.error('Improper application type')
            resolve(notifyWeb(userToken, data));
        }
    });
}

/**
 * Depricated
 * Action: This fucntion wil notify only IOS users who has device token of type ios
 */
// function notifyIos(userToken, data) {
//     var options = {
//         token: {
//             key: '../../../config/AuthKey_4D8W787ST5.p8',
//             keyId: "4D8W787ST5",
//             teamId: "NLX3LFN4KF"
//         },
//         production: true
//     };

//     var apnProvider = new apn.Provider(options);

//     //   let base64Token = "fHbi4u6wHkw:APA91bE4sEbjzKuH7OxA0p5YmsoH7sLQXA9_DHgEU2SJ1scfrRXr4LPGw35Qa6lrVf8SHnrqWURuNqtRqSvPhXEgIm21FBvh8PXkp9dAiQWHO0Wcqt4L_IUTsm_u0zndJdYh9ugu90zr"

//     let deviceToken = userToken.endpoint; // TODO: Convert it to hexa code

//     var note = new apn.Notification();

//     note.expiry = Math.floor(Date.now() / 1000) + 3600; // Expires 1 hour from now.
//     note.badge = 3;
//     // note.sound = "ping.aiff";
//     note.alert = "\uD83D\uDCE7 \u2709 You have a new message";
//     note.payload = { 'messageFrom': 'John Appleseed' };
//     note.topic = "com.whitemasterysys.dinamic";

//     return new Promise((resolve, reject) => {
//         apnProvider.send(note, deviceToken).then((result) => {
//             // see documentation for an explanation of result
//         });
//     })
// }

function notifyIos(userToken, data) {
    var serverKey = 'AAAAceW3nQ0:APA91bE6g6jPNqvhLBP9G9hRKrd9_WOhe6KWHuC-nxqZDZdhdFQeu3uZ4rmVoILW0WbWBjyws4iROxuLIRJDP_TBjYI_BD226YLYk4rlo_sA8EiL8vdcs-sAVrNrPLTq6zmuMRXQsGqu'; //put your server key here
    // Set up the sender with your GCM/FCM API key (declare this once for multiple messages)
    var sender = new gcm.Sender(serverKey);

    var message = new gcm.Message({
        // collapseKey: 'demo',
        // priority: 'high',
        // contentAvailable: true,
        // delayWhileIdle: true,
        // timeToLive: 3,
        // restrictedPackageName: "somePackageName",
        // dryRun: true,
        data: {
            _id: data._id ? data._id : '',
            type: data.type ? data.type : '',
            status: data.mobile_data ? data.mobile_data : '',
            click_action: "FLUTTER_NOTIFICATION_CLICK",
            sound: "default",
        },
        
        notification: {
            title: "DiNAMIC POS",
            icon: "ic_launcher",
            body: data.message
        }
    });

    // var regTokens = ['c32vUTyymzo:APA91bHGyag9sRIx4WK3xfmC8az6dc6gK5GhdFCheLCngjbT8L-qmsB5EGFYFSZKT8PmqUkDpPLn6mSjQMHYaKg1O0E8YcVpyp5DVWB2Mq2hJ4AvB8NzIhEl4SnjUSj39S3cq15pJWeP'];
    var regTokens = [userToken.endpoint];

    // Actually send the message
    return new Promise((resolve, reject) => {
        sender.send(message, { registrationTokens: regTokens }, function (err, response) {
            if (err) {
                console.error('error sending notification ------------', err.body ? err.body : err)
                reject(err);
            } else {
                resolve(response)
            }
        });
    })
}


/**
 * Action: This fucntion wil notify only android users who has device token of type android
 */
function notifyAndroid(userToken, data) {
    var serverKey = 'AAAAceW3nQ0:APA91bE6g6jPNqvhLBP9G9hRKrd9_WOhe6KWHuC-nxqZDZdhdFQeu3uZ4rmVoILW0WbWBjyws4iROxuLIRJDP_TBjYI_BD226YLYk4rlo_sA8EiL8vdcs-sAVrNrPLTq6zmuMRXQsGqu'; //put your server key here
    // Set up the sender with your GCM/FCM API key (declare this once for multiple messages)
    var sender = new gcm.Sender(serverKey);

    var message = new gcm.Message({
        // collapseKey: 'demo',
        // priority: 'high',
        // contentAvailable: true,
        // delayWhileIdle: true,
        // timeToLive: 3,
        // restrictedPackageName: "somePackageName",
        // dryRun: true,
        data: {
            _id: data._id ? data._id : '',
            type: data.type ? data.type : '',
            status: data.mobile_data ? data.mobile_data : '',
            click_action: "FLUTTER_NOTIFICATION_CLICK",
            sound: "default",
        },
        
        notification: {
            title: "DiNAMIC POS",
            icon: "ic_launcher",
            body: data.message
        }
    });

    // var regTokens = ['c32vUTyymzo:APA91bHGyag9sRIx4WK3xfmC8az6dc6gK5GhdFCheLCngjbT8L-qmsB5EGFYFSZKT8PmqUkDpPLn6mSjQMHYaKg1O0E8YcVpyp5DVWB2Mq2hJ4AvB8NzIhEl4SnjUSj39S3cq15pJWeP'];
    var regTokens = [userToken.endpoint];

    // Actually send the message
    return new Promise((resolve, reject) => {
        sender.send(message, { registrationTokens: regTokens }, function (err, response) {
            if (err) {
                console.error('error sending notification ------------', err.body ? err.body : err)
                reject(err);
            } else {
                resolve(response)
            }
        });
    })
}

/**
 * Action: This fucntion wil notify only web users who has device token of type web
 */
function notifyWeb(userToken, data) {
    const notificationPayload = {
        notification: {
            title: "DiNAMIC POS",
            body: data.message,
            icon: "assets/icons/icon-144x144.png",
            vibrate: [100, 50, 100],
            type: "update",
            data: data.message,
            actions: [
                { action: "explore", title: "Go to the site" }
            ]
        }
    };
    return new Promise((resolve, reject) => {
        resolve(webpush.sendNotification(userToken, JSON.stringify(notificationPayload)).catch(err => {
            console.error('error sending notification ------------', err.body ? err.body : err)
        }))
    });

    // Promise.all(
    //     webpush.sendNotification(
    //         userToken,
    //         JSON.stringify(notificationPayload)
    //     )).then(() => {
    //         return ({ message: 'success' })
    //     })
    //     .catch(err => {
    //         console.error('catch block')
    //         return ({ message: 'not notified to everyone' })
    //     });
}
