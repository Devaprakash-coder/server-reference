'use strict';
const Offer = require('../../models/managementModels/offers.model');

/**
 * NOTE: Used to get all offers available in a company
 * @params { companyId }
 */
exports.getAllOffers = (req, res) => {

}

/**
 * NOTE: Used to get all available Offers of a particular branch
 * @params { branchId }
 */
exports.getBranchOffers = (req, res) => {
    let branchId;

    if(req.accessType === 'guest' || req.accessType === 'admin'  || req.accessType === 'superadmin' || req.accessType === 'staffs') {
        branchId = req.params.branchId;
    }else{
        res.status(401).json({
            status: 0,
            message: 'Access Denied',
            error: 'Invalid Access'
        });
        return;
    }
    Offer.find({ branch_id:  branchId }, (err, offerList) => {
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
            res.status(200).json({
                status: 1,
                message: 'offers obtained successfully',
                offers: offerList
            })
        }
    })
}

/**
 * NOTE: Used to get particular Offer of a particular branch
 * @params { offerId }
 */
exports.getOffer = (req, res) => {

}

/**
 * NOTE: Used to add / modfy particular Offer
 * @params { offerId }
 * 
 */
exports.updateOffer = (req, res) => {
    let offerData = req.body.offer_details;
    // if(req.accessType === '')
    if(offerData._id) { //existing offer
        Offer.findOne({ _id: offerData._id }, (err, offers) => {
            if(err) {
                console.error('err ---------', err);
                res.status(500).json({
                    status: 0,
                    message: 'error saving offer',
                    error: 'problem with the server'
                })
            }else if(offers) {
                offers.set(offerData);
                offers.save().then((result) => {
                    res.send({
                        status: 0,
                        message: 'offer saved successfully',
                        offer: result
                    })
                }).catch((err) => {
                    console.error('error occured -------', err);
                    res.send({
                        status: 0,
                        message: 'error saving offer'
                    })
                })

            }else{
                console.error('error breaching out')
            }
        })
    }else{ //noew offer
        let offer = new Offer(offerData);
        offer.save().then((result) => {
            res.send({
                status: 0,
                message: 'offer saved successfully',
                offer: result
            })
        }).catch((err) => {
            console.error('error occured -------', err);
            res.send({
                status: 0,
                message: 'error saving offer'
            })
        })
    }
}

/**
 * NOTE: Used to update offerStatus of particular Offer
 * @params { offerId }
 */
exports.modifyOfferStatus = (req, res) => {
    let offerData = req.body.offer_details;
    let isContainOfferId = offerData._id;

    if(isContainOfferId) {
        Offer.findOne({ _id: offerData._id }, (err, offers) => {
            if(err) {
                res.status(500).json({
                    status: 0,
                    message: 'offer does not exists',
                    error: 'problem with the server'
                })
            }else if(offers) {
                offers.set(offerData);
                offers.save().then((result) => {
                    res.status(201).json({
                        status: 0,
                        message: 'offer updated successfully',
                        offer: result
                    })
                }).catch((err) => {
                    res.status(500).json({
                        status: 0,
                        message: 'error saving offer',
                        message: 'problem with the server'
                    })
                })
            }else{
                res.status(404).json({
                    status: 0,
                    message: 'offer does not exists',
                    error: 'invaild offer id'
                })
            }
        })
    }else{
        res.status(401).json({
            status: 0,
            message: 'invaild data',
            error: 'offer id is required'
        });
    }
}

/**
 * NOTE: Used to remove particular Offer
 * @params { offerId }
 */
exports.removeOffer = (req, res) => {

}