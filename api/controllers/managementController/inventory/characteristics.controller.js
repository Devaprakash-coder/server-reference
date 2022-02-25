'use strict';

const InventoryCharacteristics = require('../../../models/managementModels/inventory/characteristics.model');

exports.getInventoryCharacteristicsOfBranch = (req, res) => {
    if(req.accessType === 'superadmin' || req.accessType === 'admin' || req.accessType === 'staffs') {
        let branchId;
        branchId = req.params.branchId;

        InventoryCharacteristics.find({ branch_id: branchId }, (err, characteristics) => {
            if(err) {
                console.error({
                    status: 0,
                    message: 'error finding characteristics',
                    error: err
                });
                res.status(500).json({
                    status: 0,
                    message: 'error finding characteristics',
                    error: 'problem with the server'
                });
            }else if(!characteristics) {
                console.error({
                    status: 0,
                    message: 'no characteristics found',
                    error: 'invalid parameters'
                });
                res.status(404).json({
                    status: 0,
                    message: 'no characteristics found',
                    error: 'invalid parameters'
                });
            }else{
                res.status(200).json({
                    status: 1,
                    message: 'characteristics obtained successfully',
                    data: characteristics,
                    type: 'get'
                });
            }
        });
    }else {
        res.status(401).json({
            status: 0,
            message: 'permission denied',
            error: 'invalid access'
        });
    }
};
/**
 * @description
 * This is used both for updating and addig inventory characteristics
 * common for both the methods PUT and POST
 */
exports.updateInventoryCharacteristics = (req, res) => {
    let characteristics_data = req.body.data;
    if(req.accessType === 'superadmin' || req.accessType === 'admin' || req.accessType === 'staffs') {
        if(!characteristics_data._id) {            
            let newCharacteristics = new InventoryCharacteristics(characteristics_data);

            newCharacteristics.save().then((savedCharacteristics) => {
                res.status(201).json({
                    status: 1,
                    message: 'characteristics saved successfully',
                    data: savedCharacteristics,
                    type: 'new'
                });
            }).catch((err) => {
                console.error({
                    status: 0,
                    message: 'error saving characteristics',
                    error: err
                });
                res.status(500).json({
                    status: 0,
                    message: 'error saving characteristics',
                    error: 'problem with the server'
                });
            })
        }else{
            InventoryCharacteristics.findOne({ _id: characteristics_data._id }, (err, characteristic) => {
                if(err) {
                    console.error({
                        status: 0,
                        message: 'error getting characteristics',
                        error: err
                    });
                    res.status(500).json({
                        status: 0,
                        message: 'error updating characteristics',
                        error: 'problem with the server'
                    });
                }else if(!characteristic) {
                    res.status(404).json({
                        status: 0,
                        message: 'no characteristics found',
                        error: 'invalid parameters'
                    });
                }else {
                    characteristic.set(characteristics_data);
                    characteristic.save().then((updatedCharacteristics) => {
                        res.status(201).json({
                            status: 1,
                            message: 'characteristics updated successfully',
                            data: updatedCharacteristics,
                            type: 'update'
                        });
                    }).catch((err) => {
                        console.error({
                            status: 0,
                            message: 'error updating characteristics',
                            error: err
                        });
                        res.status(500).json({
                            status: 0,
                            message: 'error updating characteristics',
                            error: 'problem with the server'
                        });
                    })
                }
            })
        }
    }else {
        res.status(401).json({
            status: 0,
            message: 'permission denied',
            error: 'invalid access'
        });
    }
};

exports.removeInventoryCharacteristics = (req, res) => {
    if(req.accessType === 'superadmin' || req.accessType === 'admin' || req.accessType === 'staffs') {
        let characteristicId = req.params.characteristicId;
        InventoryCharacteristics.findOneAndRemove({ _id: characteristicId }, (err, removedCharacteristics) => {
            if(err) {
                console.error({
                    status: 0,
                    message: 'error removing characteristics',
                    error: err
                });
                res.status(500).json({
                    status: 0,
                    message: 'error removing characteristics',
                    error: 'problem with the server'
                });
            }else if(!removedCharacteristics){
                console.error({
                    status: 0,
                    message: 'characteristics does not exist',
                    error: 'invalid parameters'
                });
                res.status(500).json({
                    status: 0,
                    message: 'characteristics does not exist',
                    error: 'invalid parameters'
                });
            } else{
                res.status(201).json({
                    status: 1,
                    message: 'characteristics removed successfully',
                    data: removedCharacteristics,
                    type: 'remove'
                });
            }
        });
    }else {
        res.status(401).json({
            status: 0,
            message: 'permission denied',
            error: 'invalid access'
        });
    }
};