'use strict';

const Reservation = require('../../models/managementModels/reservation.model');
const Customer = require('../../models/managementModels/customer_directory.model');

//For whole company reservation
exports.getAllReservations = (req, res) => {
    Reservation.find({ company_id: req.companyId }, (err, reservations) => {
        if (err) throw err;
        res.json(reservations);
    })
}

exports.getBranchReservations = (req, res) => {
    let query_value = '';
    if(req.accessType === "superadmin" || req.accessType === "admin" || req.accessType === "staffs") {
        query_value = req.params.branchId;
    }
    Reservation.find({ branch_id: query_value }, (err, reservations) => {
        if (err) throw err;
        res.json(reservations);
    })
}

exports.getReservations = (req, res) => {
    Reservation.findOne({ _id: req.params.reservationId }, (err, reservation) => {
        if (err) throw err;
        res.json(reservation);
    })
}

//remove it if not needed
exports.addReservation = (req, res) => {
    let reservationData = req.body.reservation_details;
    
    reservationData.company_id = req.companyId;
    if(req.accessType === "superadmin" || req.accessType === "admin" || req.accessType === "staffs") {
        reservationData.branch_id = reservationData.branch_id;
     }else{
        res.status(401).send({ 'message' : 'UnAuthorized Access'});
    }

    let reservation = new Reservation(reservationData);

    Customer.findOne({ $or: [{ email: reservationData.email }, { contact_number: reservationData.mobile }] }, (err, results) => {
        if (err) {
            console.error('getting error', err);
            res.status(500).json({
                status: 0,
                message: 'error getting customer',
                error: 'problem with the server'
            })
        }else if (results !== null) {
            //TODO increase view and chenage the customer type
            res.send('user already exists')
        } else {
            let userData = [];
            userData.company_id = req.companyId;
            userData.name = reservationData.name;
            userData.email = reservationData.email || '';
            userData.contact_number = reservationData.mobile || '';
            userData.visits = "1";
            userData.reward_points = "0";

            let customer = new Customer(userData);
            customer.save((err, savedCustomer) => {
                if (err) throw err;
                reservation.reserver_id = savedCustomer._id;
                reservation.save((err, addedReservation) => {
                    if (err) throw err;
                    res.json(addedReservation);
                })
            })

        }
    })
}

//no idea on update reservation
exports.updateReservation = (req, res) => {
    let reservationData = req.body.reservation_details;
    if(req.accessType === "superadmin" || req.accessType === "admin" || req.accessType === "staffs") {
        reservationData.branch_id = reservationData.branch_id;
    }else{
        res.status(401).send({ 'message' : 'UnAuthorized Access'})
    }

    if (!reservationData._id) {
        reservationData.company_id = req.companyId
        Customer.findOne({ $or: [{ email: reservationData.email }, { contact_number: reservationData.contact_number }] }, (err, results) => {
            if (err) {
                console.error('getting error', err);
                res.status(500).json({
                    status: 0,
                    message: 'error updating reservation',
                    error: 'probem with the server'
                })
            }else if (results !== null) {
                Customer.findOneAndUpdate({ '_id': results._id }, { $inc: { 'visits': 1 } }, (err, updatedResult) => {
                    if (err) { 
                        console.error('error saving item', err);
                        res.status(500).json({
                            status: 0,
                            message: 'error updating customer',
                            error: 'problem with the server'
                        });
                    } else {
                        reservationData.reserver_id = results._id;
                        let reservation = new Reservation(reservationData)
                        reservation.save((err, updatedDetails) => {
                            if (err) {
                                console.error('error saving item', err);
                                res.status(500).json({
                                    status: 0,
                                    message: 'error updating customer',
                                    error: 'problem with the server'
                                });
                            }else{
                                res.json(updatedDetails);
                            }
                        })
                    }
                })
            } else {
                let userData = [];
                userData.company_id = req.companyId;
                userData.name = reservationData.name;
                userData.email = reservationData.email || '';
                userData.contact_number = reservationData.contact_number || '';
                userData.visits = 0;
                userData.reward_points = 0;

                let customer = new Customer(userData);
                customer.save((err, savedCustomer) => {
                    if (err) throw err;
                    reservationData.reserver_id = savedCustomer._id;
                    let reservation = new Reservation(reservationData);
                    reservation.save((err, addedReservation) => {
                        if (err) throw err;
                        res.json(addedReservation);
                    })
                })

            }
        })
    } else if (reservationData._id) {
        Reservation.findById({ _id: reservationData._id }, (err, reservation_result) => {
            if (err) throw err;
            reservation_result.set(reservationData);

            reservation_result.save((err, updatedDetails) => {
                if (err) throw err;
                res.json(updatedDetails);
            })
        })
    }
}

exports.removeReservation = (req, res) => {
    let reservationData = req.body.reservation_details;
    if(req.accessType === "superadmin" || req.accessType === "admin" || req.accessType === "staffs") {
        reservationData.branch_id = reservationData.branch_id;
    } else{
        res.status(401).send({ 'message' : 'UnAuthorized Access'})
    }

    Reservation.findOne({ _id: reservationData._id }, (err, reservation_result) => {
        if (err) {
            console.error({
                status: 0,
                message: 'error finding reservation',
                error: err
            });
            res.status(500).json({
                status: 0,
                message: 'error finding reservation',
                error: 'problem with the server'
            })
        }else{
            Customer.findOneAndUpdate({ '_id': reservation_result.reserver_id }, { $inc: { 'visits': -1 } }, (err, updatedResult) => {
                if (err) {
                    console.error({
                        status: 0,
                        message: 'error saving item',
                        error: err
                    });
                    res.status(500).json({
                        status: 0,
                        message: 'error saving item',
                        error: 'problem with the server'
                    })
                }else {
                    Reservation.update({ '_id': reservationData._id }, {
                        '$set': { 'status': 'removed' }
                    }, function (err, result) {
                        if (err) {
                            console.error({
                                status: 0,
                                message: 'error removing stock item',
                                error: err
                            });
                            res.status(500).json({
                                status: 0,
                                message: 'error removing stock item',
                                error: 'problem with the server'
                            })
                        }else{
                            res.send(result)
                        }
                    });
                }
            })
        }
    })
}