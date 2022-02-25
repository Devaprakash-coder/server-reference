// 'use strict';
// const customerType = require('../../models/managementModels/customer_type.model');

// exports.getCustomerTypes = (req, res) => {
//     customerType.find({ 'company_id': req.companyId }, (err, types) => {
//         if (err) throw err;
//         res.json(types)
//     })
// }

// exports.addCustomerType = (req, res) => {
//     let typeData = [];
//     typeData.company_id = req.companyId;
//     typeData.type = req.body.type;

//     let type = new customerType(typeData);
//     type.save((err, savedType) => {
//         if (err) {
//             res.send({ message: "Error saving branch! Please try later" })
//         } else {
//             res.json(savedType);
//         }
//     })
// }

// exports.updateCustomerType = (req, res) => {
//     let typeDetail = req.body.type_detail;
//     customerType.findById(typeDetail._id, (err, detail) => {
//         if (err) {
//             throw err;
//         } else {
//             detail.set(typeDetail);

//             detail.save((err, updatedResult) => {
//                 if (err) throw err;
//                 res.json(updatedResult);
//             })
//         }

//     })
// }

// exports.removeCustomerType = (req, res) => {
//     let typeDetail = req.body.type_detail;
//     customerType.findById(typeDetail._id, (err, detail) => {
//         if (err) {
//             throw err;
//         } else {
//             detail.set({ 'type_status': 'removed' });

//             detail.save((err, updatedResult) => {
//                 if (err) throw err;
//                 res.json(updatedResult);
//             })
//         }

//     })
// }