'use strict';

const Coupon = require('../../models/managementModels/claimed_offers.model');
const Offer = require('../../models/managementModels/offers.model');
const Order = require('../../models/omsModels/order.model');

exports.createCoupon = async (req, res)=> {
    let offerData = req.body.coupon_details;

    let offer = await  Offer.findOne({ _id: offerData.offer_id }, (err, offer) => {
        if(err) {
            res.status(500).json({
                status: 0,
                message: 'Problem with the server',
                error: 'Problem with the server'
            });
            return;
        }else if(offer){
            return;
        }else{
            res.status(404).json({
                status: 0,
                message: 'offer not exists'
            });
            return;
        }
    });

    let generatedCode = await stringGen(6);

    let couponData = {
        branch_id: offer.branch_id
        , offer_id: offer._id
        , offer_title: offer.title
        , generated_coupon: generatedCode
        , reward_points: offer.req_reward_points
        , offer_description: offer.offer_description
        , offer_type: offer.offer_type
        , offer_value: offer.offer_value
        , minimum_bill_value: offer.minimum_bill_value
        , max_discount_amount: offer.max_discount_amount
        , claim_status: 'claimed'
        , claimed_by: req.userId
        , claimed_at: Date.now()
    }

    let newCoupon = new Coupon(couponData);

    await newCoupon.save().then((result) => {
        res.status(200).json({
            status: 1,
            message: 'coupon generated successfully',
            coupon: result
        })
    }).catch(err => {
        console.error('error occured ---------', err);
        res.status(500).json({
            status: 1,
            message: 'error generating coupon',
            error: 'problem with the server'
        })
    })
}

exports.getOfferCoupons = async (req, res) => {
    let branchId;
    if(req.accessType === 'guest') {
        branchId = req.branchId;
    }else{
        res.status(401).json({
            status: 0,
            message: 'Access Denied',
            error: 'Invalid Access'
        });
        return;
    }
    Offer.find({ branch_id:  branchId }, async (err, offerList) => {
        if(err) {
            console.error({
                status: 0,
                message: 'error getting offers',
                error: err
            });
            res.status(200).json({
                status: 0,
                message: 'error getting offers',
                err: 'problem with the server'
            })
        }else {
            let userClaimedOffers = await Coupon.find({ claimed_by : req.userId }, (err, claimedOffers) => {
                if(err) {
                    res.status(500).json({
                        status: 0,
                        message: 'error with server'
                    });
                    return;
                }else{
                    return claimedOffers;
                }
            });
            let offerListCopy = JSON.parse(JSON.stringify(offerList));

            await offerListCopy.forEach((offer) => {
                offer.claim_status = 'unclaimed';
                offer.offer_code = null;
                offer.coupon_id = null;
                userClaimedOffers.forEach(claimed_offer => {
                    if(claimed_offer.offer_id === offer._id) {
                        offer.claim_status = claimed_offer.claim_status;
                        offer.offer_code = claimed_offer.generated_coupon;
                        offer.coupon_id = claimed_offer._id;
                    }
                })
            })

            res.status(200).json({
                status: 1,
                message: 'offers obtained successfully',
                offers: offerListCopy
            })
        }
    })
}

exports.updateCouponStatus = async (req, res)=> {
    let couponData = req.body.coupon_details;
    let query;
    if(req.accessType === 'guest') {
        query = { _id: couponData._id }
    }else if(req.accessType === 'superadmin' || req.accessType === 'admin' || req.accessType === "staffs") {
        query = { generated_coupon: couponData.coupon_code }
    }else{
        res.status(401).json({
            status: 0,
            message: 'invalid access'
        });
        res.end();
    }

    Coupon.findOne(query, (err, couponResult) => {
        if(err) {
            console.error({
                status: 0,
                message: 'error applying coupon',
                error: err
            });
            res.status(500).json({
                status: 0,
                message: 'error applying coupon',
                error: 'problem with the server'
            });
            return;
        }else if(couponResult && couponResult.claim_status === 'applied') {
            res.status(400).json({
                status: 0,
                message: 'coupon applied already',
                error: 'invalid coupon'
            });
            return;
        }else if(couponResult && couponResult.claim_status !== 'applied') {
            if(!couponData.order_id) {
                res.status(400).json({
                    status: 0,
                    message: 'error with the order',
                    error: 'invalid data'
                });
                res.end()
            }else{
                Order.findOne({ _id: couponData.order_id }, (err, orderDetails) => {
                    if(err) {
                        res.status(500).json({
                            status: 0,
                            message: 'error getting order',
                            error: 'problem with the server'
                        });
                    }else if(orderDetails) {
                        let gstPercentage = 5; //get this from database or from order details
                        //The reason the valriable gstPercentage is seperated is so we can use this dinamically in future
                        let GstValue = ((gstPercentage / 100) *  orderDetails.final_cost);
                        let orderAmountWithGst = GstValue + orderDetails.final_cost;
                        if(orderAmountWithGst >=  couponResult.minimum_bill_value) {
                            let offer_detail = {
                                offer_id: couponResult.offer_id
                                , coupon_id: couponResult._id
                                , offer_type: couponResult.offer_type
                                , offer_value: couponResult.offer_value
                                , offer_code: couponResult.offer_title
                                , applied_coupon: couponResult.generated_coupon
                                , offer_description: couponResult.offer_description
                            }
                            // let maxOfferValue = 
                            let offer_amount = 0;

                            if(offer_detail.offer_type === 'percentage') {
                                //getOfferValue
                                let discount_amnt = (offer_detail.offer_value/100) * orderDetails.final_cost;
                                offer_amount = (discount_amnt > couponResult.max_discount_amount)  ? couponResult.max_discount_amount : discount_amnt;
                            }else{
                                // Handle for other  getOfferValue
                            }
                            //update orderwith offer
                            Order.update({ _id: couponData.order_id }, { $set: { offer_applied: 1, offer_detail: offer_detail }, offer_value: offer_amount}, (err, updatedOrder) => {
                                if(err) {
                                    console.error({
                                        status: 0,
                                        message: `error updating order`,
                                        error: err
                                    })
                                    res.status(500).json({
                                        status: 0,
                                        message: 'error updating order',
                                        error: 'problem with the server'
                                    })
                                }else{
                                    couponData.applied_at = Date.now();
                                    couponData.applied_for_order = couponData.order_id;
                                    couponResult.set(couponData);
                                    couponResult.save((err, updatedCoupon) => {
                                        if(err) {
                                            console.error({
                                                status: 0,
                                                message: 'error applying coupon',
                                                error: err
                                            });
                                            res.status(500).json({
                                                status: 0,
                                                message: 'error applying coupon',
                                                error: 'problem with the server'
                                            });
                                        }else{
                                            res.status(201).json({
                                                status: 1,
                                                message: 'coupon applied successfully',
                                                data: updatedCoupon
                                            });
                                        }
                                    });
                                }
                            })
                            //update coupon as applied
                        }else{
                            res.status(400).json({
                                status: 0,
                                message: `bill should be atleast or greater than ${couponResult.minimum_bill_value}`,
                                error: 'coupon not applied'
                            })
                        }
                    }else{
                        res.status(404).json({
                            status: 0,
                            message: 'order not found',
                            error: 'invalid order'
                        });
                    }
                })
            }
            // couponData.applied_at = Date.now();
            // couponResult.set(couponData);
            // couponResult.save((err, updatedCoupon) => {
            //     if(err) {
            //         console.error({
            //             status: 0,
            //             message: 'error applying coupon',
            //             error: err
            //         });
            //         res.status(500).json({
            //             status: 0,
            //             message: 'error applying coupon',
            //             error: 'problem with the server'
            //         });
            //     }else{
            //         res.status(201).json({
            //             status: 1,
            //             message: 'coupon applied successfully',
            //             data: updatedCoupon
            //         });
            //     }
            // });
        }else{
            res.status(404).json({
                status: 0,
                message: 'invalid coupon',
                error: 'coupon not found'
            });
        }
    })
}

async function stringGen(len) {
    var text = "";
    var charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    for (var i = 0; i < len; i++)
      text += charset.charAt(Math.floor(Math.random() * charset.length));
    return text;
}