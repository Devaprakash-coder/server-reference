const BillCollection = require('../models/omsModels/bill.model');
const BillHistoryCollection = require('../models/history/omsModels/bill_history.model');
const PaymentHistoryCollection = require('./../models/history/omsModels/payment_history.model');

exports.updateBillStatus = async (req, res) => {
    let updateData = req.body.payment_details;
    if (!updateData.bill_id) {
        console.error({
            status: 0,
            message: "Please pass the bill id",
            error: "no bill id"
        });
        res.status(404).json({
            status: 0,
            message: "Please pass the bill id",
            error: "No bill Id found"
        });
    } else {
        /**
         * Note: This will update status including paid_by detail
         */

        let activeBill = await BillCollection.findOne({ "bills._id": updateData.bill_id });
        let completedBill = await BillHistoryCollection.findOne({ "bills._id": updateData.bill_id });
        let completedPayment = await PaymentHistoryCollection.findOne({ "bill_id": updateData.bill_id });

        if (completedPayment && activeBill) {
            Bill.findOneAndUpdate(
                { "bills._id": updateData.bill_id },
                {
                    $set: {
                        "bills.$.bill_status": updateData.status,
                    }
                },
                { new: true },
                (err, updatedBill) => {
                    if (err) {
                        console.error({
                            status: 0,
                            message: "Error updating bills",
                            error: err
                        });
                        res.status(500).json({
                            status: 0,
                            message: "Error updating bills",
                            error: "problem with the server"
                        });
                    } else {
                        PaymentHistoryCollection.findOneAndUpdate(
                            { "bill_id": updateData.bill_id },
                            {
                                $set: {
                                    "payment_status": updateData.status,
                                }
                            },
                            { new: true },
                            (err, updatedPayment) => {
                                if (err) {
                                    console.error({
                                        status: 0,
                                        message: "Error updating bills",
                                        error: err
                                    });
                                    res.status(500).json({
                                        status: 0,
                                        message: "Error updating bills",
                                        error: "problem with the server"
                                    });
                                } else {
                                    res.status(201).json({
                                        status: 1,
                                        message: "payment updated successfully",
                                    }); 
                                }
                            }
                        )
                    }
                }
            );
        } else if (completedPayment && completedBill) {
            BillHistoryCollection.findOneAndUpdate(
                { "bills._id": updateData.bill_id },
                {
                    $set: {
                        "bills.$.bill_status": updateData.status,
                    }
                },
                { new: true },
                (err, updatedBill) => {
                    if (err) {
                        console.error({
                            status: 0,
                            message: "Error updating bills",
                            error: err
                        });
                        res.status(500).json({
                            status: 0,
                            message: "Error updating bills",
                            error: "problem with the server"
                        });
                    } else {
                        PaymentHistoryCollection.findOneAndUpdate(
                            { "bill_id": updateData.bill_id },
                            {
                                $set: {
                                    "payment_status": updateData.status,
                                }
                            },
                            { new: true },
                            (err, updatedPayment) => {
                                if (err) {
                                    console.error({
                                        status: 0,
                                        message: "Error updating bills",
                                        error: err
                                    });
                                    res.status(500).json({
                                        status: 0,
                                        message: "Error updating bills",
                                        error: "problem with the server"
                                    });
                                } else {
                                    res.status(201).json({
                                        status: 1,
                                        message: "payment updated successfully",
                                    }); 
                                }
                            }
                        )
                    }
                }
            );
        } else if(!activeBill && !completedBill && completedPayment) {
            PaymentHistoryCollection.findOneAndUpdate(
                { "bill_id": updateData.bill_id },
                {
                    $set: {
                        "payment_status": updateData.status,
                    }
                },
                { new: true },
                (err, updatedPayment) => {
                    if (err) {
                        console.error({
                            status: 0,
                            message: "Error updating bills",
                            error: err
                        });
                        res.status(500).json({
                            status: 0,
                            message: "Error updating bills",
                            error: "problem with the server"
                        });
                    } else {
                        res.status(201).json({
                            status: 1,
                            message: "payment updated successfully",
                        }); 
                    }
                }
            )
        } else {
            console.error({
                status: 0,
                message: "Error updating bills",
            });
            res.status(500).json({
                status: 0,
                message: "Error updating payment, paymnet not found",
            });
        }
    }
};