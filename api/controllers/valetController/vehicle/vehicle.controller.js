'use strict'
const Vehicle = require('../../../models/valetModels/vehicle.model')
const VehicleHistory = require('../../../models/history/valet/vehicle_history.model')
const SocketController = require('../../common/socket.controller')
// const RedisController = require('../../common/redis.controller')
const axios = require('axios');

/**
 * Used to get branch vehicles
 * @param branchId
 */
exports.getBranchVehicles = (req, res) => {
    let branchId = req.params.branchId;
    if(!branchId) {
        res.status(400).json({
            status: 0,
            message: 'invalid parameters',
            error: 'please pass your branch id'
        })
    } else{
        Vehicle.find({ branch_id: branchId }, (err, vehicleList) => {
            if(err) {
                console.error({
                    status: 0,
                    message: 'error finding vehicles',
                    error: err
                })
                res.status(500).json({
                    status: 0,
                    message: 'error finding vehicles',
                    error: 'problem with the server'
                })
            }else if(!vehicleList.length) {
                res.status(200).json({
                    status: 1,
                    message: 'no vehicles found for this branch',
                    data: []
                })
            }else{
                // RedisController.client.set(`branch_valet_${branchId}`, JSON.stringify(vehicleList));
                res.status(200).json({
                    status: 1,
                    message: 'vehicles obtained successfully',
                    data: vehicleList
                })
            }
        })
    }
}
/**
 * Used to get a particular vehicle
 * @param veletId
 * used redis cache
 */
exports.getVehicleDetails = (req, res) => {
    let valetId = req.params.valetId;
    if(!valetId) {
        res.status(400).json({
            status: 0,
            message: 'invalid parameters',
            error: 'please pass your valet id'
        })
    } else{
        Vehicle.findOne({ _id: valetId }, (err, vechicledetail) => {
            if(err) {
                console.error({
                    status: 0,
                    message: 'error finding vehicle',
                    error: err
                })
                res.status(500).json({
                    status: 0,
                    message: 'error finding vehicle',
                    error: 'problem with the server'
                })
            }else if(!vechicledetail) {
                res.status(404).json({
                    status: 0,
                    message: 'vehicle is unavailable',
                    error: 'no vehicle found'
                })
            }else{
                // RedisController.client.set(`valet_${valetId}`, JSON.stringify(vechicledetail))
                res.status(200).json({
                    status: 1,
                    message: 'vehicles obtained successfully',
                    data: vechicledetail
                })
            }
        })
    }
}
/**
 * Used to update / add vehicles to branch
 * used redis cache
 */
exports.updateVehicle = async (req, res) => {
    let vehicleData = req.body.vehicle_details;
    if(vehicleData._id) {
        // CASE: Existing parked vehicle, ACTION: Update
        Vehicle.findOne({ _id: vehicleData._id }, (err, vehicleDetail) => {
            if(err) {
                console.error({
                    status: 0,
                    message: 'error finding vehicle',
                    error: err
                })
                res.status(500).json({
                    status: 0,
                    message: 'error finding vehicle',
                    error: 'problem with the server'
                })
            } else if(vehicleDetail) {
                if(vehicleData.action === 'hold') {
                    vehicleData['vehicle_status'] = 'on_hold'
                    vehicleData['last_action_time'] = Date.now();
                    // vehicleData['delivery_time'] = new Date(vehicleDetail.delivery_time).setMinutes(vehicleDetail.delivery_time.getMinutes() + vehicleData.requested_delay);
                    vehicleData['delivery_time'] = new Date().setMinutes(new Date().getMinutes() + vehicleData.requested_delay);
                } else if(vehicleData.action === 'confirm') {
                    if(vehicleDetail.vehicle_status === 're_request') {
                        vehicleData['vehicle_status'] = 're_confirmed'
                    } else{
                        vehicleData['vehicle_status'] = 'confirmed'
                    }
                    vehicleData['last_action_time'] = Date.now()
                    vehicleData['delivery_time'] = new Date().setMinutes( new Date().getMinutes() + vehicleDetail.requested_delay);
                } else if(vehicleData.action === 'ready') {
                    if(vehicleDetail.vehicle_status === 're_confirmed') {
                        vehicleData['vehicle_status'] = 're_waiting';
                    } else{
                        vehicleData['vehicle_status'] = 'waiting';
                    }
                    vehicleData['delivery_time'] = new Date().setMinutes( new Date().getMinutes() + vehicleDetail.requested_delay);
                    vehicleData['last_action_time'] = Date.now()
                } else if(vehicleData.action === 'park') {
                    vehicleData['vehicle_status'] = 'parked'
                    vehicleData['last_action_time'] = Date.now()
                } else if(vehicleData.action === 're_request') {
                    vehicleData['vehicle_status'] = 're_request'
                    vehicleData['last_action_time'] = Date.now();
                    vehicleData['delivery_time'] = new Date(vehicleDetail.delivery_time).setMinutes(vehicleDetail.delivery_time.getMinutes() + vehicleData.requested_delay);
                } else {
                    console.info('doing nothing')
                }
                let updated_vehicle_data = vehicleDetail.set(vehicleData);
                updated_vehicle_data.save().then(async (updatedDetails) => {
                    // NOTE: Send socket to user, if the onwer puts in on-hold
                    // NOTE: Run Timer if the request is on hold  // setTimeOut()
                    // NOTE: Send Socket to Branch After the setTimeOut Period To make the ON HOLD As COMFIRM
                    // RedisController.client.set(`valet_${vehicleDetail._id}`, JSON.stringify(updated_vehicle_data))
                    if(vehicleData.action === 'hold') {
                        // Send a POST request
                        await axios({
                            method: 'post',
                            url: 'https://dinamic.io/mobileapi/user/auth/update_valet_status',
                            data: { valet_id : vehicleDetail.valet_id, valet_status : 'on_hold' }
                        });
                        SocketController.io.sockets.in(vehicleData.serial_number).emit("update_valet", {
                            vehicle_status : 'on_hold',
                            delay: vehicleData.requested_delay,
                            delivery_time: vehicleData.delivery_time
                        });
                        SocketController.io.sockets.in(vehicleData.branch_id).emit("update_valet", vehicleData.branch_id);
                        setTimeout(async () => {
                            vehicleData['vehicle_status'] = 'requested_2'
                            vehicleData['last_action_time'] = Date.now()
                            updated_vehicle_data = vehicleDetail.set(vehicleData);
                            updated_vehicle_data.save();
                            // await RedisController.client.get(`branch_valet_${updated_vehicle_data.branch_id}`, (err, vehicleList) => {
                            //     if(err) {
                            //         RedisController.client.del(`branch_valet_${updated_vehicle_data.branch_id}`)
                            //     } else {
                            //         let existingVehicleList = JSON.parse(vehicleList);
                            //         // existingVehicleList.push(result);
                            //         existingVehicleList.forEach((element, i) => {
                            //             if(element._id === vehicleData._id) {
                            //                 existingVehicleList[i] = updated_vehicle_data
                            //             }
                            //         });
        
                            //         RedisController.client.set(`branch_valet_${updated_vehicle_data.branch_id}`, JSON.stringify(existingVehicleList));
                            //         RedisController.client.set(`valet_${vehicleDetail._id}`, JSON.stringify(updated_vehicle_data))
                            //     }
                            // })

                            SocketController.io.sockets.in(vehicleData.serial_number).emit("update_valet", {
                                vehicle_status : vehicleData['vehicle_status'],
                                delay: vehicleData.requested_delay,
                                delivery_time: vehicleData.delivery_time
                            });
                            SocketController.io.sockets.in(vehicleData.branch_id).emit("update_valet", vehicleData.branch_id);
                        }, vehicleData.requested_delay * 1000 * 60)
                    } else if(vehicleData.action === 'confirm') {
                        await axios({
                            method: 'post',
                            url: 'https://dinamic.io/mobileapi/user/auth/update_valet_status',
                            data: { valet_id : vehicleDetail.valet_id, valet_status : vehicleData['vehicle_status'] }
                        });
                        SocketController.io.sockets.in(vehicleData.serial_number).emit("update_valet", {
                            vehicle_status : vehicleData['vehicle_status'],
                            delivery_time: vehicleData.delivery_time
                        });
                        SocketController.io.sockets.in(vehicleData.branch_id).emit("update_valet", vehicleData.branch_id);
                    } else if(vehicleData.action === 'ready') {
                        await axios({
                            method: 'post',
                            url: 'https://dinamic.io/mobileapi/user/auth/update_valet_status',
                            data: { valet_id : vehicleDetail.valet_id, valet_status : vehicleData['vehicle_status'] === 'waiting' ? 'vehicle_ready': 'vehicle_re_ready' }
                        });
                        SocketController.io.sockets.in(vehicleData.serial_number).emit("update_valet", {
                            vehicle_status : vehicleData['vehicle_status'] === 'waiting' ? 'vehicle_ready': 'vehicle_re_ready',
                            delivery_time: vehicleData.delivery_time
                        });
                        SocketController.io.sockets.in(vehicleData.branch_id).emit("update_valet", vehicleData.branch_id);
                    } else if(vehicleData.action === 'park') {
                        await axios({
                            method: 'post',
                            url: 'https://dinamic.io/mobileapi/user/auth/update_valet_status',
                            data: { valet_id : vehicleDetail.valet_id, valet_status : 'vehicle_parked' }
                        });
                        SocketController.io.sockets.in(vehicleData.serial_number).emit("update_valet", {
                            vehicle_status : 'vehicle_parked',
                        })
                        SocketController.io.sockets.in(vehicleData.branch_id).emit("update_valet", vehicleData.branch_id);
                    } else if(vehicleData.action === 're_request') {
                        await axios({
                            method: 'post',
                            url: 'https://dinamic.io/mobileapi/user/auth/update_valet_status',
                            data: { valet_id : vehicleDetail.valet_id, valet_status : vehicleData['vehicle_status'] }
                        });
                        SocketController.io.sockets.in(vehicleData.serial_number).emit("update_valet", {
                            vehicle_status : vehicleData['vehicle_status'],
                            delivery_time: vehicleData.delivery_time
                        });
                        SocketController.io.sockets.in(vehicleData.branch_id).emit("update_valet", vehicleData.branch_id);
                    }
                    
                    // await RedisController.client.get(`branch_valet_${updated_vehicle_data.branch_id}`, (err, vehicleList) => {
                    //     if(err) {
                    //         RedisController.client.del(`branch_valet_${updated_vehicle_data.branch_id}`)
                    //     } else {                            
                    //         let existingVehicleList;
                    //         if(!vehicleList) {
                    //             existingVehicleList = []
                    //         }else{
                    //             existingVehicleList = JSON.parse(vehicleList)
                    //         }
                    //         // existingVehicleList.push(result);
                    //         existingVehicleList.forEach((element, i) => {
                    //             if(element._id === vehicleData._id) {
                    //                 existingVehicleList[i] = updated_vehicle_data
                    //             }
                    //         });

                    //         RedisController.client.set(`branch_valet_${updated_vehicle_data.branch_id}`, JSON.stringify(existingVehicleList));
                    //         // RedisController.client.get(`branch_valet_${updated_vehicle_data.branch_id}`, (err, result) => {
                    //         // })
                    //         RedisController.client.set(`valet_${vehicleDetail._id}`, JSON.stringify(updated_vehicle_data));
                    //     }

                    //     res.status(201).json({
                    //         status: 1,
                    //         message: 'updated successfully',
                    //     })
                    // });

                    res.status(201).json({
                        status: 1,
                        message: 'updated successfully',
                    })

                    
                }).catch((err) => {
                    console.error({
                        status: 0,
                        message: 'error updating vehicle',
                        error: err
                    })
                    res.status(500).json({
                        status: 0,
                        message: 'error updating vehicle',
                        error: 'problem with the server'
                    })
                })
            } else {
                res.status(400).json({
                    status: 0,
                    message: 'error finding vehicle',
                    error: 'invalid parameters'
                })
            }
        })
    } else{
        // CASE: New vehicle, ACTION: Save
        Vehicle.findOne({ branch_id: vehicleData.branch_id , serial_number: vehicleData.serial_number }, (err, existingVehicle) => {
            if(err) {
                console.error({
                    status: 0,
                    message: 'error adding vehicle',
                    error: error
                })
                res.status(500).json({
                    status: 0,
                    message: 'error adding vehicle',
                    error: 'problem with the server'
                })
            } else if(existingVehicle) {
                console.error({
                    status: 0,
                    message: 'serial number already active',
                    error: 'invalid access'
                })
                res.status(400).json({
                    status: 0,
                    message: 'serial number already active',
                    error: 'invalid access'
                })
            } else{
                vehicleData.company_id =  req.companyId;
                getNextColor(vehicleData.branch_id, (color) => {
                    vehicleData.card_color = color
                    vehicleData.vehicle_status = 'requested_1'
                    let vehicle = new Vehicle(vehicleData);
                    vehicle.save().then(async (result) => {
                        // Socket to branchId to reload data (check it)
                        // Send vehicle delivery time in socket
                        // await RedisController.client.get(`branch_valet_${result.branch_id}`, (err, vehicleList) => {
                        //     if(err) {
                        //         RedisController.client.del(`branch_valet_${result.branch_id}`)
                        //     } else {
                        //         let existingVehicleList;
                        //         if(!vehicleList) {
                        //             existingVehicleList = []
                        //         }else{
                        //             existingVehicleList = JSON.parse(vehicleList);
                        //         }
                        //         existingVehicleList.push(result);
                        //         RedisController.client.set(`branch_valet_${result.branch_id}`, JSON.stringify(existingVehicleList))
                        //         RedisController.client.set(`valet_${result._id}`, JSON.stringify(result))
                        //     }
                        // });
                        SocketController.io.sockets.in(vehicleData.branch_id).emit("update_valet", vehicleData.branch_id)
                        SocketController.io.sockets.in(vehicleData.serial_number).emit("update_valet", {
                            vehicle_status : 'awaiting',
                            valet_id: result._id
                        })
                        res.status(201).json({
                            status: 1,
                            message: 'vehicle added successfully',
                            data: result
                        });
                    }).catch((error) => {
                        console.error({
                            status: 0,
                            message: 'error adding vehicle',
                            error: error
                        })
                        res.status(500).json({
                            status: 0,
                            message: 'error adding vehicle',
                            error: 'problem with the server'
                        })
                    })
                })
            }
        }) 
    }
}
/**
 * Used to remove vehicle from live to history
 * @param valetId
 * used redis cache
 */
exports.removeVehicle = (req, res) => {
    let valetId = req.params.valetId;
    if(!valetId) {
        console.error({
            status: 0,
            message: 'error finding vehicle',
            error: 'no valid valetId found'
        })
        res.status(400).json({
            status: 0,
            message: 'error finding vehicle',
            error: 'invalid parameters'
        })
    } else {
        Vehicle.findOne({ _id : valetId }, (err, vehicleDetails) => {
            if(err) {
                console.error({
                    status: 0,
                    message: 'error finding vehicle',
                    error: err
                })
                res.status(500).json({
                    status: 0,
                    message: 'error finding vehicle',
                    error: 'problem with the server'
                })
            } else if(!vehicleDetails) {
                res.status(404).json({
                    status: 0,
                    message: 'no vehicles found',
                    error: 'invalid parameters'
                })
            } else {
                Vehicle.remove({ _id: vehicleDetails._id }, async (err, removedVehicle) =>{
                    if(err) {
                        console.error({
                            status: 0,
                            message: 'error removing vehicle',
                            error: err
                        })
                        res.status(500).json({
                            status: 0,
                            message: 'error removing vehicle',
                            error: 'problem with the server'
                        })
                    }else{ 
                        
                        // TODO: remove particular vehicle from branch cache
                        // RedisController.del(`branch_valet_${vehicleDetails.branch_id}`);
                        // await RedisController.client.get(`branch_valet_${vehicleDetails.branch_id}`, (err, vehicleList) => {
                        //     if(err) {
                        //         RedisController.client.del(`branch_valet_${vehicleDetails.branch_id}`)
                        //     } else {
                        //         let existingVehicleList;
                        //         if(!vehicleList) {
                        //             existingVehicleList = []
                        //         }else{
                        //             existingVehicleList = JSON.parse(vehicleList);
                        //         }
                        //         existingVehicleList.forEach((vehicle, i) => {
                        //             if(vehicle._id == vehicleDetails._id) {
                        //                 existingVehicleList.splice(i, 1)
                        //             }
                        //         })
                        //         RedisController.client.set(`branch_valet_${vehicleDetails.branch_id}`, JSON.stringify(existingVehicleList))
                        //         RedisController.client.del(`valet_${vehicleDetails._id}`)
                        //     }
                        // });

                        let vehicle_detail = JSON.parse(JSON.stringify(vehicleDetails));
                        let vehicle_history = new VehicleHistory(vehicle_detail);
                        vehicle_history.save().then((savedHistory) => {
                            SocketController.io.sockets.in(vehicleDetails.branch_id).emit("update_valet", vehicleDetails.branch_id)
                            axios({
                                method: 'post',
                                url: 'https://dinamic.io/mobileapi/user/auth/update_valet_status',
                                data: { valet_id : vehicleDetails.valet_id, valet_status : 'delivered' }
                            });
                            // await axios({
                            //     method: 'post',
                            //     url: 'https://dinamic.io/mobileapi/user/auth/update_valet_status',
                            //     data: { valet_id : vehicleDetail.valet_id, valet_status : 'on_hold' }
                            // });
                            SocketController.io.sockets.in(vehicleDetails.serial_number).emit("update_valet", {
                                vehicle_status : 'delivered',
                                valet_id: vehicleDetails._id
                            });
                            // Send a POST request
                            res.status(201).json({
                                status: 1,
                                message: 'vehicle removed successfully',
                            })
                        }).catch((err) => {
                            console.error({
                                status: 0,
                                message: 'error removing vehicle',
                                error: err
                            })
                            res.status(500).json({
                                status: 0,
                                message: 'error removing vehicle',
                                error: 'problem with the server'
                            })
                        })
                    }
                })
            }
        })
    }
}
/**
 * 
 * @param {*} branchId 
 * @param {*} next 
 */
async function getNextColor(branchId, next) {
    let colors = ["radio-red", "passcode-pink", "podcast-purple", "bookmark-blue", "bluetooth-blue", "gateway-green", "greenfield-green", "overwrite-orange", "backlink-brown", "gigabyte-grey"];
    await Vehicle.find({ branch_id: branchId }, (err, vehicles) => {
        if (err) {
            console.error({
                status: 0,
                message: 'Error Finding table',
                error: err
            });
            next(err)
        } else {
            let valetCount = null;
            let vehiclesCount = vehicles.length;
            if (vehiclesCount < 10) {
                valetCount = vehiclesCount;
            } else {
                valetCount = (vehiclesCount % 10)
            }
            // We here have  10 choices to select. So,
            if (valetCount == 0) {
                next(colors[0]);
            } else if (valetCount == 1) {
                next(colors[1]);
            } else if (valetCount == 2) {
                next(colors[2])
            } else if (valetCount == 3) {
                next(colors[3]);
            } else if (valetCount == 4) {
                next(colors[4]);
            } else if (valetCount == 5) {
                next(colors[5]);
            } else if (valetCount == 6) {
                next(colors[6]);
            } else if (valetCount == 7) {
                next(colors[7])
            } else if (valetCount == 8) {
                next(colors[8]);
            } else if (valetCount == 9) {
                next(colors[9]);
            }
        }
    })
}

/**
 * Common Middleware to check weather the vehicle is avaiable in cache
 * used redis cache
 */
exports.vehicleCahe = (req, res, next) => {
    const valetId = req.params.valetId;
    client.get(`valet_${valetId}`, (err, vechicledetail) => {
        if (err) {
            next();
        }if (vechicledetail != null) {
            res.status(200).json({
                status: 1,
                message: 'vehicles obtained successfully',
                data: JSON.parse(vechicledetail)
            })
        } else {
            next();
        }
    });
}

/**
 * Common Middleware to check weather the vehicle lists avaiable in cache
 * used redis cache
 */
exports.vehicleListCahe = (req, res, next) => {
    const branchId = req.params.branchId;
    client.get(`branch_valet_${branchId}`, (err, vehicleList) => {
        if (err) {
            next();
        }else if (vehicleList != null && vehicleList.length > 0) {
            res.status(200).json({
                status: 1,
                message: 'vehicles obtained successfully',
                data: JSON.parse(vehicleList)
            })
        } else {
            next();
        }
    });
}

